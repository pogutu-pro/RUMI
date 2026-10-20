"""Leasing endpoints: documents, notices, debt recovery, rent reviews."""

from __future__ import annotations

from datetime import date

from django.contrib.auth import get_user_model
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit.models import log_audit
from core.permissions.rumia import get_canonical_role
from leasing.models import DebtCase, RentReview, TenancyDocument
from leasing.services import DebtService, DocumentService, LeasingError, RentReviewService, arrears
from organizations.models import OrganizationMembership
from properties.models import Tenancy
from rumia_api.views import RumiaBaseView, _caretaker_can

User = get_user_model()
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_UPLOAD_TYPES = {'application/pdf', 'image/jpeg', 'image/png'}


class TenancyDocumentSerializer(serializers.ModelSerializer):
    kind_label = serializers.CharField(source='get_kind_display', read_only=True)

    class Meta:
        model = TenancyDocument
        fields = ['id', 'tenancy', 'kind', 'kind_label', 'title', 'generated', 'visible_to_tenant', 'details', 'sent_at',
                  'created_at']
        read_only_fields = fields


class DebtCaseSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenancy.tenant.full_name', read_only=True)
    unit_number = serializers.CharField(source='tenancy.unit.unit_number', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    arrears_now = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()

    class Meta:
        model = DebtCase
        fields = ['id', 'tenancy', 'tenant_name', 'unit_number', 'assigned_to', 'assigned_to_name', 'status',
                  'amount_at_open', 'arrears_now', 'promise_date', 'promise_amount', 'closed_reason', 'notes',
                  'created_at', 'updated_at']
        read_only_fields = fields

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name().strip() or obj.assigned_to.email if obj.assigned_to else None

    def get_arrears_now(self, obj):
        return str(arrears(obj.tenancy))

    def get_notes(self, obj):
        return [{'text': n.text, 'author': (n.author.get_full_name().strip() or n.author.email) if n.author else 'System',
                 'created_at': n.created_at} for n in obj.notes.select_related('author')]


class RentReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = RentReview
        fields = ['id', 'tenancy', 'effective_date', 'new_monthly_rent', 'increase_percent', 'repeat_annually',
                  'notified_at', 'applied_at', 'previous_rent', 'applied_rent', 'cancelled_at', 'created_at']
        read_only_fields = ['id', 'tenancy', 'notified_at', 'applied_at', 'previous_rent', 'applied_rent',
                            'cancelled_at', 'created_at']


def _forbidden():
    return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)


class LeasingBase(RumiaBaseView):
    permission_classes = [IsAuthenticated]
    property_lookup = 'parent_property'

    def role(self):
        return get_canonical_role(self.request.user)

    def manager(self, flag='can_manage_tenants') -> bool:
        return self.role() in ('landlord', 'super_admin') or (
            self.role() == 'caretaker' and _caretaker_can(self.request.user, flag)
        )

    def tenancy(self, pk):
        qs = self.filter_by_organization(Tenancy.objects.select_related('tenant', 'unit', 'parent_property', 'organization'))
        if self.role() == 'tenant':
            qs = qs.filter(tenant__user=self.request.user)
        return get_object_or_404(qs, pk=pk)


class TenancyDocumentsView(LeasingBase):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, pk):
        tenancy = self.tenancy(pk)
        docs = tenancy.documents.all()
        if self.role() == 'tenant':
            docs = docs.filter(visible_to_tenant=True)
        return Response(TenancyDocumentSerializer(docs, many=True).data)

    def post(self, request, pk):
        """Upload a backup document (PDF/JPEG/PNG, ≤ 5 MB)."""
        if not self.manager():
            return _forbidden()
        tenancy = self.tenancy(pk)
        upload = request.FILES.get('file')
        kind = request.data.get('kind', 'other')
        if upload is None:
            return Response({'file': 'Attach a file.'}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > MAX_UPLOAD_BYTES or upload.content_type not in ALLOWED_UPLOAD_TYPES:
            return Response({'file': 'PDF, JPEG or PNG up to 5 MB.'}, status=status.HTTP_400_BAD_REQUEST)
        if kind not in dict(TenancyDocument.KIND_CHOICES):
            return Response({'kind': 'Unknown document type.'}, status=status.HTTP_400_BAD_REQUEST)
        doc = TenancyDocument.objects.create(
            organization=tenancy.organization, tenancy=tenancy, kind=kind,
            title=(request.data.get('title') or upload.name)[:200], file=upload,
            visible_to_tenant=str(request.data.get('visible_to_tenant', 'true')).lower() == 'true',
            created_by=request.user,
        )
        return Response(TenancyDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


class GenerateDocumentView(LeasingBase):
    def post(self, request, pk):
        if not self.manager():
            return _forbidden()
        tenancy = self.tenancy(pk)
        kind = request.data.get('kind')
        try:
            if kind == 'lease':
                doc = DocumentService.lease(tenancy, created_by=request.user)
            elif kind == 'demand_note':
                doc = DocumentService.demand_note(tenancy, int(request.data.get('pay_within_days', 7)), created_by=request.user)
            elif kind == 'quit_notice':
                vacate_by = request.data.get('vacate_by')
                doc = DocumentService.quit_notice(
                    tenancy, date.fromisoformat(vacate_by) if vacate_by else None,
                    str(request.data.get('reason', '')), created_by=request.user,
                )
            else:
                return Response({'kind': 'Use lease, demand_note or quit_notice.'}, status=status.HTTP_400_BAD_REQUEST)
        except (LeasingError, ValueError) as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        if request.data.get('send', True) in (True, 'true'):
            DocumentService.send(doc)
            doc.refresh_from_db()
        log_audit('other', actor=request.user, organization=tenancy.organization, entity=doc,
                  metadata={'document': kind, 'title': doc.title})
        return Response(TenancyDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


class DocumentDownloadView(LeasingBase):
    def get(self, request, pk):
        qs = self.filter_by_organization(TenancyDocument.objects.select_related('tenancy'))
        if self.role() == 'tenant':
            qs = qs.filter(tenancy__tenant__user=request.user, visible_to_tenant=True)
        doc = get_object_or_404(qs, pk=pk)
        return FileResponse(doc.file.open('rb'), as_attachment=True, filename=doc.file.name.rsplit('/', 1)[-1])


class NoticeToVacateView(LeasingBase):
    def post(self, request, pk):
        if self.role() != 'tenant' and not self.manager():
            return _forbidden()
        tenancy = self.tenancy(pk)
        try:
            move_out = date.fromisoformat(str(request.data.get('move_out_date')))
            doc = DocumentService.notice_to_vacate(
                tenancy, move_out, str(request.data.get('reason', '')), given_by=request.user,
                by_tenant=self.role() == 'tenant',
            )
        except (LeasingError, ValueError) as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        log_audit('tenancy_updated', actor=request.user, organization=tenancy.organization, entity=tenancy,
                  metadata={'notice_to_vacate': str(move_out)})
        return Response(TenancyDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


class ArrearsView(LeasingBase):
    """Tenancies with overdue balances and their debt case, if any — the debt-recovery worklist."""

    def get(self, request):
        if not self.manager('can_view_payments') and not self.manager():
            return _forbidden()
        tenancies = self.filter_by_organization(
            Tenancy.objects.filter(status__in=('active', 'notice_period', 'terminated', 'expired'))
            .select_related('tenant', 'unit', 'parent_property')
        )
        cases = {c.tenancy_id: c for c in DebtCase.objects.exclude(status='closed').filter(tenancy__in=tenancies)}
        rows = []
        for tenancy in tenancies:
            owed = arrears(tenancy)
            if owed <= 0:
                continue
            case = cases.get(tenancy.pk)
            rows.append({
                'tenancy': str(tenancy.pk), 'tenant_name': tenancy.tenant.full_name, 'phone': tenancy.tenant.phone,
                'unit_number': tenancy.unit.unit_number, 'property_name': tenancy.parent_property.name,
                'status': tenancy.status, 'arrears': str(owed),
                'case': DebtCaseSerializer(case).data if case else None,
            })
        return Response(sorted(rows, key=lambda r: -float(r['arrears'])))


class DebtCaseListCreateView(LeasingBase):
    def get(self, request):
        if not self.manager():
            return _forbidden()
        qs = self.filter_by_organization(DebtCase.objects.select_related('tenancy__tenant', 'tenancy__unit', 'assigned_to'))
        if self.role() == 'caretaker':
            qs = qs.filter(assigned_to=request.user)
        if request.query_params.get('status'):
            qs = qs.filter(status=request.query_params['status'])
        return Response(DebtCaseSerializer(qs, many=True).data)

    def post(self, request):
        if not self.manager():
            return _forbidden()
        tenancy = self.tenancy(request.data.get('tenancy'))
        assignee = None
        if request.data.get('assigned_to'):
            assignee = _staff(tenancy.organization).filter(pk=request.data['assigned_to']).first()
            if assignee is None:
                return Response({'assigned_to': 'Choose someone in your organization.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            case = DebtService.open_case(tenancy, assignee, created_by=request.user, note=str(request.data.get('note', '')))
        except LeasingError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DebtCaseSerializer(case).data, status=status.HTTP_201_CREATED)


class DebtCaseDetailView(LeasingBase):
    def case(self, pk):
        qs = self.filter_by_organization(DebtCase.objects.select_related('tenancy'))
        if self.role() == 'caretaker':
            qs = qs.filter(assigned_to=self.request.user)
        return get_object_or_404(qs, pk=pk)

    def patch(self, request, pk):
        if not self.manager():
            return _forbidden()
        case = self.case(pk)
        changes = {}
        for field in ('status', 'closed_reason'):
            if field in request.data:
                changes[field] = request.data[field]
        if changes.get('status') and changes['status'] not in dict(DebtCase.STATUS_CHOICES):
            return Response({'status': 'Unknown status.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if 'promise_date' in request.data:
                changes['promise_date'] = date.fromisoformat(request.data['promise_date']) if request.data['promise_date'] else None
            if 'promise_amount' in request.data:
                changes['promise_amount'] = request.data['promise_amount'] or None
            if 'assigned_to' in request.data:
                changes['assigned_to'] = _staff(case.organization).filter(pk=request.data['assigned_to']).first() \
                    if request.data['assigned_to'] else None
            DebtService.update(case, request.user, **changes)
        except (LeasingError, ValueError) as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DebtCaseSerializer(case).data)

    def post(self, request, pk):
        """Add a follow-up note (called, visited, promised…)."""
        if not self.manager():
            return _forbidden()
        case = self.case(pk)
        text = str(request.data.get('text', '')).strip()
        if not text:
            return Response({'text': 'Write a note.'}, status=status.HTTP_400_BAD_REQUEST)
        case.notes.create(author=request.user, text=text[:2000])
        return Response(DebtCaseSerializer(case).data, status=status.HTTP_201_CREATED)


def _staff(organization):
    ids = OrganizationMembership.objects.filter(organization=organization, is_active=True).values_list('user_id', flat=True)
    return User.objects.filter(pk__in=list(ids) + [organization.owner_id])


class StaffView(LeasingBase):
    def get(self, request):
        if not self.manager():
            return _forbidden()
        org_ids = self.get_user_organization_ids()
        from organizations.models import Organization
        org = Organization.objects.filter(pk__in=org_ids).first() if org_ids else None
        if org is None:
            return Response([])
        return Response([{'id': u.pk, 'name': u.get_full_name().strip() or u.email, 'role': u.role} for u in _staff(org)])


class RentReviewListCreateView(LeasingBase):
    def get(self, request, pk):
        tenancy = self.tenancy(pk)
        return Response(RentReviewSerializer(tenancy.rent_reviews.all(), many=True).data)

    def post(self, request, pk):
        if self.role() not in ('landlord', 'super_admin'):
            return _forbidden()
        tenancy = self.tenancy(pk)
        serializer = RentReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            review = RentReviewService.schedule(tenancy, created_by=request.user, **serializer.validated_data)
        except LeasingError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(RentReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class RentReviewCancelView(LeasingBase):
    def post(self, request, pk):
        if self.role() not in ('landlord', 'super_admin'):
            return _forbidden()
        review = get_object_or_404(self.filter_by_organization(RentReview.objects.all()), pk=pk, applied_at__isnull=True)
        from django.utils import timezone
        review.cancelled_at = timezone.now()
        review.save(update_fields=['cancelled_at'])
        return Response(RentReviewSerializer(review).data)
