"""Paybill endpoints — Safaricom callbacks plus owner/caretaker management."""

from __future__ import annotations

import logging

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.models import log_audit
from core.permissions.rumia import get_canonical_role
from paybill.daraja import DarajaClient, DarajaError
from paybill.models import IncomingTransaction, PaybillAccount, new_callback_token
from paybill.serializers import IncomingTransactionSerializer, PaybillAccountSerializer
from paybill.services import PaybillError, PaybillService
from properties.models import Tenancy
from rumia_api.views import RumiaBaseView, _caretaker_can

logger = logging.getLogger(__name__)

ACCEPTED = {'ResultCode': 0, 'ResultDesc': 'Accepted'}


def _forbidden():
    return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)


def _client_ip(request) -> str:
    if getattr(settings, 'MPESA_TRUST_X_FORWARDED_FOR', False):
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if forwarded:
            return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


class C2BCallbackView(APIView):
    """
    Safaricom C2B validation/confirmation. Unauthenticated by design; the
    secret token in the URL, the shortcode check and the optional IP
    allowlist are the gate (Daraja callbacks are not signed).
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    kind = 'confirm'

    def post(self, request, token):
        allowed = [ip.strip() for ip in getattr(settings, 'MPESA_CALLBACK_ALLOWED_IPS', []) if ip.strip()]
        # Safaricom adds callback addresses from time to time. A request with the
        # secret URL token from an unlisted address is kept for a person to check,
        # never auto-settled, so a real payment is not lost over a stale list.
        trusted = not allowed or _client_ip(request) in allowed

        paybill = PaybillAccount.objects.filter(callback_token=token, is_active=True).select_related('organization').first()
        if paybill is None:
            return Response({'ResultCode': 1, 'ResultDesc': 'Unknown'}, status=status.HTTP_404_NOT_FOUND)

        payload = request.data if isinstance(request.data, dict) else {}
        shortcode = str(payload.get('BusinessShortCode') or '').strip()
        if shortcode and shortcode != paybill.shortcode:
            logger.warning('Paybill callback shortcode %s does not match %s', shortcode, paybill.shortcode)
            return Response({'ResultCode': 1, 'ResultDesc': 'Rejected'}, status=status.HTTP_400_BAD_REQUEST)

        if self.kind == 'validate':
            # Always accept: rejecting would bounce a tenant's money over a
            # typo in the account number. Unmatched payments go to a queue.
            return Response(ACCEPTED)

        if not trusted:
            logger.warning('Paybill callback for %s from unlisted IP %s held for review', paybill.shortcode, _client_ip(request))
        try:
            PaybillService.ingest(paybill, payload, trusted=trusted)
        except PaybillError as exc:
            logger.error('Paybill confirmation rejected for %s: %s', paybill.shortcode, exc)
        except Exception:
            logger.exception('Paybill confirmation failed for %s', paybill.shortcode)
            return Response({'ResultCode': 1, 'ResultDesc': 'Temporary error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(ACCEPTED)


class _OwnerMixin:
    def owner_org_id(self, request):
        """The organization an owner acts on; None when not permitted."""
        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin'):
            return None
        org_ids = self.get_user_organization_ids()
        if org_ids is None:  # super_admin
            return request.query_params.get('organization_id') or request.data.get('organization_id')
        return org_ids[0] if org_ids else None


class PaybillAccountListCreateView(_OwnerMixin, RumiaBaseView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if get_canonical_role(request.user) not in ('landlord', 'super_admin'):
            return _forbidden()
        qs = self.filter_by_organization(PaybillAccount.objects.all())
        return Response(PaybillAccountSerializer(qs, many=True).data)

    def post(self, request):
        org_id = self.owner_org_id(request)
        if not org_id:
            return _forbidden()
        serializer = PaybillAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if PaybillAccount.objects.filter(shortcode=serializer.validated_data['shortcode']).exists():
            return Response({'shortcode': 'This paybill is already connected to RumiaRent.'},
                            status=status.HTTP_400_BAD_REQUEST)
        paybill = serializer.save(organization_id=org_id)
        log_audit('other', actor=request.user, organization=paybill.organization, entity=paybill,
                  metadata={'paybill': paybill.shortcode, 'action': 'connected'})
        return Response(PaybillAccountSerializer(paybill).data, status=status.HTTP_201_CREATED)


class PaybillAccountDetailView(_OwnerMixin, RumiaBaseView):
    permission_classes = [IsAuthenticated]
    action = None

    def get_object(self, pk):
        return get_object_or_404(self.filter_by_organization(PaybillAccount.objects.all()), pk=pk)

    def patch(self, request, pk):
        if get_canonical_role(request.user) not in ('landlord', 'super_admin'):
            return _forbidden()
        paybill = self.get_object(pk)
        serializer = PaybillAccountSerializer(paybill, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PaybillAccountSerializer(paybill).data)

    def post(self, request, pk):
        if get_canonical_role(request.user) not in ('landlord', 'super_admin'):
            return _forbidden()
        paybill = self.get_object(pk)
        if self.action == 'register':
            try:
                result = DarajaClient(paybill).register_urls()
            except DarajaError as exc:
                return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
            paybill.registered_at = timezone.now()
            paybill.registration_response = result
            paybill.save(update_fields=['registered_at', 'registration_response', 'updated_at'])
        elif self.action == 'rotate_token':
            # New secret callback URL; must be registered with Safaricom again.
            paybill.callback_token = new_callback_token()
            paybill.registered_at = None
            paybill.save(update_fields=['callback_token', 'registered_at', 'updated_at'])
        else:
            return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
        log_audit('other', actor=request.user, organization=paybill.organization, entity=paybill,
                  metadata={'paybill': paybill.shortcode, 'action': self.action})
        return Response(PaybillAccountSerializer(paybill).data)


class IncomingTransactionListView(RumiaBaseView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin') and not (
            role == 'caretaker' and (_caretaker_can(request.user, 'can_record_payments')
                                     or _caretaker_can(request.user, 'can_view_payments'))
        ):
            return _forbidden()
        qs = self.filter_by_organization(
            IncomingTransaction.objects.select_related('paybill', 'tenancy__tenant', 'tenancy__unit', 'payment__receipt')
        )
        if request.query_params.get('status'):
            qs = qs.filter(status=request.query_params['status'])
        return Response(IncomingTransactionSerializer(qs[:500], many=True).data)


class IncomingTransactionActionView(RumiaBaseView):
    permission_classes = [IsAuthenticated]
    action = None

    def post(self, request, pk):
        role = get_canonical_role(request.user)
        txn = get_object_or_404(self.filter_by_organization(IncomingTransaction.objects.all()), pk=pk)
        try:
            if self.action == 'assign':
                if role not in ('landlord', 'super_admin') and not (
                    role == 'caretaker' and _caretaker_can(request.user, 'can_record_payments')
                ):
                    return _forbidden()
                tenancy = Tenancy.objects.filter(pk=request.data.get('tenancy'), organization_id=txn.organization_id).first()
                if tenancy is None:
                    return Response({'tenancy': 'Choose a tenancy in this organization.'},
                                    status=status.HTTP_400_BAD_REQUEST)
                with transaction.atomic():
                    PaybillService.assign(txn, tenancy, request.user)
            elif self.action == 'ignore':
                if role not in ('landlord', 'super_admin'):
                    return _forbidden()
                PaybillService.ignore(txn, request.user, str(request.data.get('note', '')))
            else:
                return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
        except PaybillError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        txn.refresh_from_db()
        log_audit('payment_recorded' if self.action == 'assign' else 'other', actor=request.user,
                  organization=txn.organization, entity=txn,
                  metadata={'paybill_transaction': txn.trans_id, 'action': self.action})
        return Response(IncomingTransactionSerializer(txn).data)


class TenantPaybillInstructionsView(RumiaBaseView):
    """How a tenant pays by M-Pesa: the landlord's paybill and their own account number."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = self.filter_by_organization(Tenancy.objects.select_related('unit', 'organization'))
        if get_canonical_role(request.user) == 'tenant':
            qs = qs.filter(tenant__user=request.user)
        qs = qs.filter(status__in=('active', 'notice_period'))
        results = []
        for tenancy in qs:
            paybills = PaybillAccount.objects.filter(organization_id=tenancy.organization_id, is_active=True)
            for paybill in paybills:
                results.append({
                    'tenancy': str(tenancy.id),
                    'unit_number': tenancy.unit.unit_number,
                    'shortcode': paybill.shortcode,
                    'shortcode_type': paybill.shortcode_type,
                    'business_name': paybill.display_name or tenancy.organization.name,
                    'account_number': tenancy.payment_reference if paybill.shortcode_type == 'paybill' else '',
                })
        return Response(results)
