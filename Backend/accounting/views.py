"""Expenses and landlord statements — owner (and super_admin) only."""

from __future__ import annotations

from datetime import date

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounting.models import Expense
from accounting.services import ExpenseError, ExpenseService, StatementService, month_bounds
from audit.models import log_audit
from core.permissions.rumia import get_canonical_role
from organizations.models import Organization
from properties.models import Property
from rumia_api.views import RumiaBaseView


class ExpenseSerializer(serializers.ModelSerializer):
    property = serializers.PrimaryKeyRelatedField(
        source='parent_property', queryset=Property.objects.all(), required=False, allow_null=True,
    )
    property_name = serializers.CharField(source='parent_property.name', read_only=True, default='')
    category_label = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'property', 'property_name', 'unit', 'category', 'category_label', 'description', 'supplier',
            'amount', 'expense_date', 'paid_from', 'reference', 'voided_at', 'void_reason', 'created_at',
        ]
        read_only_fields = ['id', 'voided_at', 'void_reason', 'created_at']


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


class ExpenseListCreateView(OwnerScopedView):
    def get(self, request):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        qs = Expense.objects.filter(organization=org).select_related('parent_property')
        if request.query_params.get('property_id'):
            qs = qs.filter(parent_property_id=request.query_params['property_id'])
        if request.query_params.get('include_voided') != 'true':
            qs = qs.filter(voided_at__isnull=True)
        return Response(ExpenseSerializer(qs[:500], many=True).data)

    def post(self, request):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        serializer = ExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            expense = ExpenseService.record(org, created_by=request.user, **serializer.validated_data)
        except ExpenseError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        log_audit('other', actor=request.user, organization=org, entity=expense,
                  metadata={'expense': expense.description, 'amount': str(expense.amount)})
        return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)


class ExpenseVoidView(OwnerScopedView):
    def post(self, request, pk):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        expense = get_object_or_404(Expense, pk=pk, organization=org)
        try:
            expense = ExpenseService.void(expense, str(request.data.get('reason', '')), voided_by=request.user)
        except ExpenseError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        log_audit('other', actor=request.user, organization=org, entity=expense,
                  metadata={'expense_voided': expense.void_reason})
        return Response(ExpenseSerializer(expense).data)


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
