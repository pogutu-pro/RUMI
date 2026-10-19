"""
Phase 1 ledger endpoints — invoices, credit notes (and, in later slices,
receipts, deposits, penalty policy). Organization-scoped exactly like
rumia_api.views.
"""

from __future__ import annotations

import json

from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Prefetch
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit.models import log_audit
from core.permissions.rumia import CanViewFinancials, get_canonical_role
from properties.models import Property, PropertyConditionReport, Tenancy
from rent.models import (
    CreditNote,
    DepositSettlement,
    Invoice,
    PaymentAllocation,
    PenaltyPolicy,
    Receipt,
    RecurringCharge,
)
from rent.services.deposits import DepositError, DepositService
from rent.services.invoicing import InvoiceError, InvoiceService, LineSpec
from rent.services.receipts import ReceiptService
from rumia_api.serializers import (
    AdhocInvoiceSerializer,
    DepositRecordHeldSerializer,
    DepositRefundSerializer,
    DepositSettlementInputSerializer,
    DepositSettlementSerializer,
    CreditNoteInputSerializer,
    CreditNoteSerializer,
    InvoiceSerializer,
    PenaltyPolicySerializer,
    ReceiptSerializer,
    RecurringChargeSerializer,
)
from rumia_api.views import RumiaBaseView, _caretaker_can


def _forbidden():
    return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)


class InvoiceScopedMixin:
    """Invoice querysets limited to what the caller may see."""

    property_lookup = 'parent_property'

    def invoice_queryset(self):
        qs = self.filter_by_organization(
            Invoice.objects.select_related('tenant', 'unit').prefetch_related('lines')
        )
        if get_canonical_role(self.request.user) == 'tenant':
            qs = qs.filter(tenant__user=self.request.user)
        return qs

    def can_manage(self, flag: str) -> bool:
        role = get_canonical_role(self.request.user)
        if role in ('landlord', 'super_admin'):
            return True
        return role == 'caretaker' and _caretaker_can(self.request.user, flag)


class InvoiceListCreateView(InvoiceScopedMixin, RumiaBaseView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not CanViewFinancials().has_permission(request, self):
            return _forbidden()
        qs = self.invoice_queryset().order_by('-due_date', '-created_at')
        for param, field in (('status', 'status'), ('invoice_type', 'invoice_type'), ('tenancy_id', 'tenancy_id')):
            value = request.query_params.get(param)
            if value:
                qs = qs.filter(**{field: value})
        return Response(InvoiceSerializer(qs, many=True).data)

    def post(self, request):
        """Raise a one-off charge (repair, utility top-up, …) against a tenancy."""
        if not self.can_manage('can_create_charges'):
            return _forbidden()
        serializer = AdhocInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tenancy = serializer.validated_data['tenancy']

        org_ids = self.get_user_organization_ids()
        if org_ids is not None and tenancy.organization_id not in org_ids:
            return _forbidden()
        if get_canonical_role(request.user) == 'caretaker' and tenancy.parent_property_id not in self.get_user_property_ids():
            return _forbidden()

        due_date = serializer.validated_data['due_date']
        today = timezone.now().date()
        try:
            invoice = InvoiceService.create_invoice(
                tenancy,
                'adhoc',
                [
                    LineSpec(
                        line['line_type'], line['unit_price'], line['quantity'], line.get('description', ''),
                    )
                    for line in serializer.validated_data['lines']
                ],
                period_start=min(today, due_date),
                period_end=due_date,
                due_date=due_date,
                notes=serializer.validated_data.get('notes', ''),
                created_by=request.user,
            )
        except InvoiceError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        log_audit('rent_charge_created', actor=request.user, organization=tenancy.organization, entity=invoice,
                  metadata={'invoice_type': 'adhoc', 'number': invoice.number})
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


class InvoiceDetailView(InvoiceScopedMixin, RumiaBaseView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if not CanViewFinancials().has_permission(request, self):
            return _forbidden()
        invoice = get_object_or_404(
            self.invoice_queryset().prefetch_related(
                'credit_notes',
                Prefetch(
                    'payment_allocations',
                    queryset=PaymentAllocation.objects.select_related('payment').filter(payment__status='success'),
                ),
            ),
            pk=pk,
        )
        data = InvoiceSerializer(invoice).data
        data['credit_notes'] = CreditNoteSerializer(invoice.credit_notes.all(), many=True).data
        data['payments'] = [
            {
                'payment_id': str(allocation.payment_id),
                'reference': allocation.payment.internal_reference,
                'amount': str(allocation.amount),
                'paid_at': allocation.payment.paid_at,
                'method': allocation.payment.payment_method,
            }
            for allocation in invoice.payment_allocations.all()
        ]
        return Response(data)


class InvoiceCreditNoteView(InvoiceScopedMixin, RumiaBaseView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """Waive or discount part or all of an invoice's unpaid balance."""
        if not self.can_manage('can_waive_charges'):
            return _forbidden()
        invoice = get_object_or_404(self.invoice_queryset(), pk=pk)
        serializer = CreditNoteInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            credit_note = InvoiceService.issue_credit_note(
                invoice,
                serializer.validated_data['amount'],
                serializer.validated_data['reason'],
                created_by=request.user,
            )
        except InvoiceError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        log_audit('rent_modified', actor=request.user, organization=invoice.organization, entity=invoice,
                  metadata={'credit_note': credit_note.number, 'amount': str(credit_note.amount),
                            'reason': credit_note.reason})
        return Response(CreditNoteSerializer(credit_note).data, status=status.HTTP_201_CREATED)


class InvoiceDisputeView(InvoiceScopedMixin, RumiaBaseView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """
        Flag or clear a dispute. A tenant may raise a dispute on their own
        invoice; only landlord-side users may clear one.
        """
        role = get_canonical_role(request.user)
        disputed = bool(request.data.get('disputed', True))
        if role == 'tenant':
            if not disputed:
                return _forbidden()
        elif not self.can_manage('can_waive_charges'):
            return _forbidden()

        invoice = get_object_or_404(self.invoice_queryset(), pk=pk)
        invoice = InvoiceService.set_disputed(invoice, disputed)
        log_audit('rent_modified', actor=request.user, organization=invoice.organization, entity=invoice,
                  metadata={'disputed': disputed, 'note': str(request.data.get('note', ''))[:500]})
        return Response(InvoiceSerializer(invoice).data)


class CreditNoteListView(RumiaBaseView):
    permission_classes = [IsAuthenticated, CanViewFinancials]
    property_lookup = 'invoice__parent_property'

    def get(self, request):
        qs = self.filter_by_organization(CreditNote.objects.select_related('invoice'))
        if get_canonical_role(request.user) == 'tenant':
            qs = qs.filter(invoice__tenant__user=request.user)
        tenancy_id = request.query_params.get('tenancy_id')
        if tenancy_id:
            qs = qs.filter(invoice__tenancy_id=tenancy_id)
        return Response(CreditNoteSerializer(qs, many=True).data)


class ReceiptScopedMixin:
    property_lookup = 'payment__parent_property'

    def receipt_queryset(self):
        qs = self.filter_by_organization(
            Receipt.objects.select_related('payment__tenant')
        )
        if get_canonical_role(self.request.user) == 'tenant':
            qs = qs.filter(payment__tenant__user=self.request.user)
        return qs


class ReceiptListView(ReceiptScopedMixin, RumiaBaseView):
    permission_classes = [IsAuthenticated, CanViewFinancials]

    def get(self, request):
        qs = self.receipt_queryset()
        tenancy_id = request.query_params.get('tenancy_id')
        if tenancy_id:
            qs = qs.filter(payment__tenancy_id=tenancy_id)
        return Response(ReceiptSerializer(qs, many=True).data)


class ReceiptDetailView(ReceiptScopedMixin, RumiaBaseView):
    permission_classes = [IsAuthenticated, CanViewFinancials]

    def get(self, request, pk):
        return Response(ReceiptSerializer(get_object_or_404(self.receipt_queryset(), pk=pk)).data)


class ReceiptPdfView(ReceiptScopedMixin, RumiaBaseView):
    permission_classes = [IsAuthenticated, CanViewFinancials]

    def get(self, request, pk):
        receipt = ReceiptService.ensure_pdf(get_object_or_404(self.receipt_queryset(), pk=pk))
        receipt.pdf.open('rb')
        try:
            content = receipt.pdf.read()
        finally:
            receipt.pdf.close()
        response = HttpResponse(content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{receipt.number}.pdf"'
        return response


class ReceiptResendView(ReceiptScopedMixin, RumiaBaseView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """Landlord-side: send the receipt again (clears the sent markers, then delivers)."""
        if get_canonical_role(request.user) not in ('landlord', 'super_admin') and not (
            get_canonical_role(request.user) == 'caretaker' and _caretaker_can(request.user, 'can_record_payments')
        ):
            return _forbidden()
        receipt = get_object_or_404(self.receipt_queryset(), pk=pk)
        Receipt.objects.filter(pk=receipt.pk).update(sent_sms_at=None, sent_email_at=None)
        from rent.tasks import deliver_receipt_task

        deliver_receipt_task.delay(str(receipt.pk))
        return Response({'status': 'queued'}, status=status.HTTP_202_ACCEPTED)


class RecurringChargeMixin:
    property_lookup = 'parent_property'

    def tenancy_or_404(self, pk):
        qs = self.filter_by_organization(Tenancy.objects.all())
        if get_canonical_role(self.request.user) == 'tenant':
            qs = qs.filter(tenant__user=self.request.user)
        return get_object_or_404(qs, pk=pk)

    def can_edit(self) -> bool:
        role = get_canonical_role(self.request.user)
        return role in ('landlord', 'super_admin') or (
            role == 'caretaker' and _caretaker_can(self.request.user, 'can_manage_tenants')
        )


class TenancyRecurringChargeListCreateView(RecurringChargeMixin, RumiaBaseView):
    """Fixed monthly extras (service charge, garbage, parking…) billed with each rent invoice."""

    permission_classes = [IsAuthenticated, CanViewFinancials]

    def get(self, request, pk):
        tenancy = self.tenancy_or_404(pk)
        return Response(RecurringChargeSerializer(tenancy.recurring_charges.all(), many=True).data)

    def post(self, request, pk):
        if not self.can_edit():
            return _forbidden()
        tenancy = self.tenancy_or_404(pk)
        serializer = RecurringChargeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        charge = serializer.save(tenancy=tenancy, organization=tenancy.organization)
        log_audit('tenancy_updated', actor=request.user, organization=tenancy.organization, entity=tenancy,
                  metadata={'recurring_charge_added': str(charge.id), 'line_type': charge.line_type,
                            'amount': str(charge.amount)})
        return Response(RecurringChargeSerializer(charge).data, status=status.HTTP_201_CREATED)


class RecurringChargeDetailView(RecurringChargeMixin, RumiaBaseView):
    permission_classes = [IsAuthenticated, CanViewFinancials]
    property_lookup = 'tenancy__parent_property'

    def get_object(self, pk):
        qs = self.filter_by_organization(RecurringCharge.objects.select_related('tenancy'))
        if get_canonical_role(self.request.user) == 'tenant':
            qs = qs.filter(tenancy__tenant__user=self.request.user)
        return get_object_or_404(qs, pk=pk)

    def patch(self, request, pk):
        if not self.can_edit():
            return _forbidden()
        charge = self.get_object(pk)
        serializer = RecurringChargeSerializer(charge, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_audit('tenancy_updated', actor=request.user, organization=charge.organization, entity=charge.tenancy,
                  metadata={'recurring_charge_updated': str(charge.id)})
        return Response(serializer.data)

    def delete(self, request, pk):
        """Stops the charge from future invoices; past invoices are unaffected."""
        if not self.can_edit():
            return _forbidden()
        charge = self.get_object(pk)
        charge.is_active = False
        charge.save(update_fields=['is_active', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class PenaltyPolicyView(RumiaBaseView):
    """
    GET/PUT the late-penalty policy. Without `property_id` it is the
    organization-wide policy; with it, that property's override (DELETE
    removes the override). Landlord / super_admin only.
    """

    permission_classes = [IsAuthenticated]

    def _scope(self, request):
        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin'):
            return None, None, _forbidden()
        org_ids = self.get_user_organization_ids()
        org_id = request.query_params.get('organization_id') or (org_ids[0] if org_ids else None)
        if org_id is None or (org_ids is not None and str(org_id) not in [str(i) for i in org_ids]):
            return None, None, _forbidden()
        prop = None
        property_id = request.query_params.get('property_id')
        if property_id:
            prop = get_object_or_404(Property, pk=property_id, organization_id=org_id)
        return org_id, prop, None

    def get(self, request):
        org_id, prop, error = self._scope(request)
        if error:
            return error
        policy = PenaltyPolicy.objects.filter(organization_id=org_id, parent_property=prop).first()
        if policy is None:
            data = PenaltyPolicySerializer(PenaltyPolicy(organization_id=org_id, parent_property=prop)).data
            data['id'] = None
            return Response(data)
        return Response(PenaltyPolicySerializer(policy).data)

    def put(self, request):
        org_id, prop, error = self._scope(request)
        if error:
            return error
        policy = PenaltyPolicy.objects.filter(organization_id=org_id, parent_property=prop).first()
        serializer = PenaltyPolicySerializer(policy, data=request.data, partial=policy is not None)
        serializer.is_valid(raise_exception=True)
        policy = serializer.save(organization_id=org_id, parent_property=prop)
        snapshot = json.loads(json.dumps(PenaltyPolicySerializer(policy).data, cls=DjangoJSONEncoder))
        log_audit('other', actor=request.user, organization=policy.organization, entity=policy,
                  new_value=snapshot, metadata={'change': 'penalty_policy'})
        return Response(PenaltyPolicySerializer(policy).data)

    def delete(self, request):
        org_id, prop, error = self._scope(request)
        if error:
            return error
        if prop is None:
            return Response({'detail': 'Disable the organization policy instead of deleting it.'},
                            status=status.HTTP_400_BAD_REQUEST)
        PenaltyPolicy.objects.filter(organization_id=org_id, parent_property=prop).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _money_summary(summary: dict) -> dict:
    return {key: str(value) for key, value in summary.items()}


class TenancyDepositView(RecurringChargeMixin, RumiaBaseView):
    """GET a tenancy's deposit position and its settlements."""

    permission_classes = [IsAuthenticated, CanViewFinancials]

    def get(self, request, pk):
        tenancy = self.tenancy_or_404(pk)
        return Response({
            **_money_summary(DepositService.summary(tenancy)),
            'settlements': DepositSettlementSerializer(tenancy.deposit_settlements.all(), many=True).data,
        })


class TenancyDepositInvoiceView(RecurringChargeMixin, RumiaBaseView):
    """POST: invoice the deposit (or the part of it not yet invoiced)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not self.can_edit():
            return _forbidden()
        tenancy = self.tenancy_or_404(pk)
        try:
            invoice = DepositService.issue_invoice(tenancy, request.data.get('amount'), created_by=request.user)
        except (DepositError, InvoiceError) as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


class TenancyDepositRecordHeldView(RecurringChargeMixin, RumiaBaseView):
    """POST: record a deposit received before RumiaRent (invoice + payment, receipt not sent)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not self.can_edit():
            return _forbidden()
        tenancy = self.tenancy_or_404(pk)
        serializer = DepositRecordHeldSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payment = DepositService.record_held(tenancy, created_by=request.user, **serializer.validated_data)
        except (DepositError, InvoiceError, ValueError) as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        log_audit('payment_recorded', actor=request.user, organization=tenancy.organization, entity=payment,
                  metadata={'action': 'deposit_recorded_as_held'})
        return Response(_money_summary(DepositService.summary(tenancy)), status=status.HTTP_201_CREATED)


class TenancyDepositSettlementCreateView(RecurringChargeMixin, RumiaBaseView):
    """POST: draft the move-out deposit settlement (deductions; arrears suggested automatically)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not self.can_edit():
            return _forbidden()
        tenancy = self.tenancy_or_404(pk)
        serializer = DepositSettlementInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = None
        report_id = serializer.validated_data.get('condition_report')
        if report_id:
            report = get_object_or_404(PropertyConditionReport, pk=report_id, tenancy=tenancy)
        try:
            settlement = DepositService.create_settlement(
                tenancy,
                deductions=serializer.validated_data['deductions'],
                include_arrears=serializer.validated_data['include_arrears'],
                notes=serializer.validated_data['notes'],
                condition_report=report,
                created_by=request.user,
            )
        except DepositError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DepositSettlementSerializer(settlement).data, status=status.HTTP_201_CREATED)


class DepositSettlementActionView(RumiaBaseView):
    """GET a settlement; POST /approve/, /refund/ or /cancel/ (landlord side)."""

    permission_classes = [IsAuthenticated, CanViewFinancials]
    property_lookup = 'tenancy__parent_property'
    action = None

    def get_object(self, pk):
        qs = self.filter_by_organization(
            DepositSettlement.objects.select_related('tenancy__tenant').prefetch_related('deductions')
        )
        if get_canonical_role(self.request.user) == 'tenant':
            qs = qs.filter(tenancy__tenant__user=self.request.user)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        return Response(DepositSettlementSerializer(self.get_object(pk)).data)

    def post(self, request, pk):
        role = get_canonical_role(request.user)
        if role not in ('landlord', 'super_admin'):
            return _forbidden()  # settling money is an owner decision, not a caretaker one
        settlement = self.get_object(pk)
        try:
            if self.action == 'approve':
                settlement = DepositService.approve(settlement, approved_by=request.user)
            elif self.action == 'refund':
                serializer = DepositRefundSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                settlement = DepositService.record_refund(
                    settlement, recorded_by=request.user, **serializer.validated_data,
                )
            elif self.action == 'cancel':
                settlement = DepositService.cancel(settlement)
            else:
                return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
        except (DepositError, InvoiceError) as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        log_audit('other', actor=request.user, organization=settlement.organization, entity=settlement,
                  metadata={'deposit_settlement': settlement.number, 'action': self.action})
        settlement = self.get_object(pk)
        return Response(DepositSettlementSerializer(settlement).data)
