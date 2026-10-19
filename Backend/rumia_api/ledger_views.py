"""
Phase 1 ledger endpoints — invoices, credit notes (and, in later slices,
receipts, deposits, penalty policy). Organization-scoped exactly like
rumia_api.views.
"""

from __future__ import annotations

from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit.models import log_audit
from core.permissions.rumia import CanViewFinancials, get_canonical_role
from rent.models import CreditNote, Invoice, PaymentAllocation
from rent.services.invoicing import InvoiceError, InvoiceService, LineSpec
from rumia_api.serializers import (
    AdhocInvoiceSerializer,
    CreditNoteInputSerializer,
    CreditNoteSerializer,
    InvoiceSerializer,
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
