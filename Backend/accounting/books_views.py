"""Statements, suppliers, reports, journals and reconciliation — owner (and super_admin) only."""

from __future__ import annotations

from datetime import date

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounting.models import StatementLine, Supplier
from accounting.reports import ManualJournalService, ReconciliationService, ReportError, Reports
from accounting.books import StatementService, month_bounds
from audit.models import log_audit
from core.permissions.rumia import get_canonical_role
from organizations.models import Organization
from properties.models import Property, Tenancy
from rumia_api.views import RumiaBaseView


def _forbidden():
    return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)


class OwnerScopedView(RumiaBaseView):
    permission_classes = [IsAuthenticated]

    def organization(self, request):
        if get_canonical_role(request.user) not in ('landlord', 'super_admin'):
            return None
        org_ids = self.get_user_organization_ids()
        if org_ids is None:  # super_admin acts on an explicit organization
            org_id = request.query_params.get('organization_id') or request.data.get('organization_id')
            return Organization.objects.filter(pk=org_id).first() if org_id else None
        return Organization.objects.filter(pk__in=org_ids).first()


class StatementView(OwnerScopedView):
    """
    GET ?month=YYYY-MM (or period_start & period_end) [&property_id] [&export=pdf]
    """

    def get(self, request):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        try:
            if request.query_params.get('month'):
                year, month = (int(x) for x in request.query_params['month'].split('-'))
                start, end = month_bounds(year, month)
            else:
                start = date.fromisoformat(request.query_params['period_start'])
                end = date.fromisoformat(request.query_params['period_end'])
        except (KeyError, ValueError):
            return Response({'detail': 'Give month=YYYY-MM, or period_start and period_end (YYYY-MM-DD).'},
                            status=status.HTTP_400_BAD_REQUEST)
        if end < start or (end - start).days > 366:
            return Response({'detail': 'The period must be between 1 day and 1 year.'}, status=status.HTTP_400_BAD_REQUEST)
        prop = None
        if request.query_params.get('property_id'):
            prop = get_object_or_404(Property, pk=request.query_params['property_id'], organization=org)

        statement = StatementService.build(org, start, end, property_obj=prop)
        if request.query_params.get('export') == 'pdf':  # not 'format': DRF reserves it
            response = HttpResponse(StatementService.render_pdf(statement), content_type='application/pdf')
            name = f'statement-{start:%Y-%m}{"-" + prop.name if prop else ""}.pdf'.replace(' ', '-')
            response['Content-Disposition'] = f'attachment; filename="{name}"'
            return response
        return Response(StatementService.as_dict(statement))


# ------------------------------------------------- suppliers, reports, journals, reconciliation


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'phone', 'email', 'kra_pin', 'category', 'notes', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class SupplierListCreateView(OwnerScopedView):
    def get(self, request):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        return Response(SupplierSerializer(Supplier.objects.filter(organization=org), many=True).data)

    def post(self, request):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        serializer = SupplierSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if Supplier.objects.filter(organization=org, name__iexact=serializer.validated_data['name']).exists():
            return Response({'name': 'You already have a supplier with this name.'}, status=status.HTTP_400_BAD_REQUEST)
        supplier = serializer.save(organization=org)
        return Response(SupplierSerializer(supplier).data, status=status.HTTP_201_CREATED)


def _date_param(request, name, default=None):
    value = request.query_params.get(name)
    return date.fromisoformat(value) if value else default


class ReportView(OwnerScopedView):
    """GET ?report=trial_balance|income_statement|balance_sheet&as_of=|period_start=&period_end=[&property_id]"""

    def get(self, request):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        from django.utils import timezone
        today = timezone.localdate()
        try:
            report = request.query_params.get('report')
            if report == 'trial_balance':
                return Response(Reports.trial_balance(org, _date_param(request, 'as_of', today)))
            if report == 'balance_sheet':
                return Response(Reports.balance_sheet(org, _date_param(request, 'as_of', today)))
            if report == 'income_statement':
                prop = None
                if request.query_params.get('property_id'):
                    prop = get_object_or_404(Property, pk=request.query_params['property_id'], organization=org)
                return Response(Reports.income_statement(
                    org, _date_param(request, 'period_start', today.replace(day=1)), _date_param(request, 'period_end', today), prop,
                ))
            if report == 'accounts':
                return Response(Reports.accounts(org))
        except ValueError:
            return Response({'detail': 'Dates must be YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'report': 'Use trial_balance, income_statement, balance_sheet or accounts.'},
                        status=status.HTTP_400_BAD_REQUEST)


class ManualJournalView(OwnerScopedView):
    def post(self, request):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        try:
            entry = ManualJournalService.post(
                org, date.fromisoformat(str(request.data.get('entry_date'))), str(request.data.get('memo', '')),
                list(request.data.get('lines') or []), created_by=request.user,
            )
        except (ReportError, ValueError) as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        log_audit('other', actor=request.user, organization=org, entity=entry, metadata={'manual_journal': entry.memo})
        return Response({'id': str(entry.pk), 'memo': entry.memo, 'entry_date': entry.entry_date.isoformat()},
                        status=status.HTTP_201_CREATED)


class StatementLineSerializer(serializers.ModelSerializer):
    payment_reference = serializers.CharField(source='payment.internal_reference', read_only=True, default=None)
    tenant_name = serializers.CharField(source='payment.tenant.full_name', read_only=True, default=None)

    class Meta:
        model = StatementLine
        fields = ['id', 'line_date', 'reference', 'description', 'amount', 'status', 'payment', 'payment_reference',
                  'tenant_name', 'note']
        read_only_fields = fields


class StatementImportView(OwnerScopedView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        lines = StatementLine.objects.filter(statement__organization=org).select_related('payment__tenant')
        if request.query_params.get('status'):
            lines = lines.filter(status=request.query_params['status'])
        return Response(StatementLineSerializer(lines.order_by('-line_date')[:1000], many=True).data)

    def post(self, request):
        """multipart: file, account_code, date_column, amount_column, reference_column, description_column"""
        org = self.organization(request)
        if org is None:
            return _forbidden()
        upload = request.FILES.get('file')
        if upload is None or upload.size > 5 * 1024 * 1024:
            return Response({'file': 'Attach a CSV file up to 5 MB.'}, status=status.HTTP_400_BAD_REQUEST)
        mapping = {k: request.data.get(f'{k}_column', '') for k in ('date', 'amount', 'reference', 'description')}
        try:
            statement = ReconciliationService.import_csv(org, str(request.data.get('account_code')), upload, mapping,
                                                         imported_by=request.user)
        except ReportError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        counts = {s: statement.lines.filter(status=s).count() for s in ('matched', 'unmatched')}
        return Response({'id': str(statement.pk), 'lines': statement.lines.count(), **counts}, status=status.HTTP_201_CREATED)


class StatementLineActionView(OwnerScopedView):
    action = None

    def post(self, request, pk):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        line = get_object_or_404(StatementLine, pk=pk, statement__organization=org)
        try:
            if self.action == 'assign':
                tenancy = get_object_or_404(Tenancy, pk=request.data.get('tenancy'), organization=org)
                ReconciliationService.assign(line, tenancy, user=request.user)
            else:
                ReconciliationService.ignore(line, str(request.data.get('note', '')))
        except ReportError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        line.refresh_from_db()
        return Response(StatementLineSerializer(line).data)
