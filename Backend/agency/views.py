"""Agency endpoints — owner (organization) side only."""

from __future__ import annotations

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.response import Response

from accounting.services import month_bounds
from accounting.views import OwnerScopedView
from agency.models import OwnerStatement, OwnerTransaction, PropertyOwner
from agency.services import AgencyError, OwnerStatementService, OwnerTransactionService
from audit.models import log_audit


class PropertyOwnerSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()
    property_ids = serializers.SerializerMethodField()

    class Meta:
        model = PropertyOwner
        fields = [
            'id', 'full_name', 'phone', 'email', 'kra_pin', 'payout_method', 'payout_details',
            'management_fee_percent', 'letting_fee_percent', 'commission_on_penalties', 'notes', 'is_active',
            'balance', 'property_ids', 'created_at',
        ]
        read_only_fields = ['id', 'balance', 'property_ids', 'created_at']

    def get_balance(self, obj):
        return str(OwnerStatementService.balance(obj))

    def get_property_ids(self, obj):
        return [str(pk) for pk in obj.properties.values_list('pk', flat=True)]


class OwnerStatementSerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnerStatement
        fields = ['id', 'number', 'period_start', 'period_end', 'net_due', 'figures', 'approved_at', 'emailed_at']
        read_only_fields = fields


class OwnerTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnerTransaction
        fields = ['id', 'kind', 'amount', 'transaction_date', 'method', 'reference', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


def _forbidden():
    return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)


def _period(request):
    year, month = (int(x) for x in str(request.query_params.get('month') or request.data.get('month')).split('-'))
    return month_bounds(year, month)


class OwnerListCreateView(OwnerScopedView):
    def get(self, request):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        return Response(PropertyOwnerSerializer(PropertyOwner.objects.filter(organization=org), many=True).data)

    def post(self, request):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        serializer = PropertyOwnerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        owner = serializer.save(organization=org)
        log_audit('other', actor=request.user, organization=org, entity=owner, metadata={'owner_created': owner.full_name})
        return Response(PropertyOwnerSerializer(owner).data, status=status.HTTP_201_CREATED)


class OwnerDetailView(OwnerScopedView):
    def owner(self, request, pk):
        org = self.organization(request)
        return None if org is None else get_object_or_404(PropertyOwner, pk=pk, organization=org)

    def get(self, request, pk):
        owner = self.owner(request, pk)
        if owner is None:
            return _forbidden()
        return Response(PropertyOwnerSerializer(owner).data)

    def patch(self, request, pk):
        owner = self.owner(request, pk)
        if owner is None:
            return _forbidden()
        serializer = PropertyOwnerSerializer(owner, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class OwnerStatementListView(OwnerDetailView):
    """GET: approved statements. POST {month}: approve the statement for that month."""

    def get(self, request, pk):
        owner = self.owner(request, pk)
        if owner is None:
            return _forbidden()
        return Response(OwnerStatementSerializer(owner.statements.all(), many=True).data)

    def post(self, request, pk):
        owner = self.owner(request, pk)
        if owner is None:
            return _forbidden()
        try:
            start, end = _period(request)
            statement = OwnerStatementService.approve(owner, start, end, approved_by=request.user)
        except (ValueError, AgencyError) as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        if request.data.get('email', True):
            OwnerStatementService.email(statement)
            statement.refresh_from_db()
        log_audit('other', actor=request.user, organization=owner.organization, entity=statement,
                  metadata={'owner_statement': statement.number, 'net_due': str(statement.net_due)})
        return Response(OwnerStatementSerializer(statement).data, status=status.HTTP_201_CREATED)


class OwnerStatementPreviewView(OwnerDetailView):
    def get(self, request, pk):
        owner = self.owner(request, pk)
        if owner is None:
            return _forbidden()
        try:
            start, end = _period(request)
        except ValueError:
            return Response({'detail': 'Give month=YYYY-MM.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OwnerStatementService.compute(owner, start, end))


class OwnerStatementPdfView(OwnerScopedView):
    def get(self, request, pk):
        org = self.organization(request)
        if org is None:
            return _forbidden()
        statement = get_object_or_404(OwnerStatement, pk=pk, organization=org)
        response = HttpResponse(OwnerStatementService.render_pdf(statement), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{statement.number}.pdf"'
        return response


class OwnerTransactionListCreateView(OwnerDetailView):
    def get(self, request, pk):
        owner = self.owner(request, pk)
        if owner is None:
            return _forbidden()
        return Response(OwnerTransactionSerializer(owner.transactions.all(), many=True).data)

    def post(self, request, pk):
        owner = self.owner(request, pk)
        if owner is None:
            return _forbidden()
        serializer = OwnerTransactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            txn = OwnerTransactionService.record(owner, created_by=request.user, **serializer.validated_data)
        except AgencyError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        log_audit('other', actor=request.user, organization=owner.organization, entity=txn,
                  metadata={'owner_transaction': txn.kind, 'amount': str(txn.amount)})
        return Response(OwnerTransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
