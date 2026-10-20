import os
import uuid
from datetime import date

from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.models import log_audit
from core.permissions.rumia import get_canonical_role
from organizations.models import Organization
from properties.models import Property

from . import services
from .books import ExpenseError, ExpenseService
from .models import Expense, MriFiling, OrganizationTaxProfile, Supplier, TaxRateConfig

MAX_RECEIPT_BYTES = 5 * 1024 * 1024
ALLOWED_RECEIPT_TYPES = {'.jpg', '.jpeg', '.png', '.pdf', '.webp'}


def parse_month(raw: str | None) -> date | None:
    """'2026-09' -> date(2026, 9, 1). None if missing or malformed."""
    try:
        year, month = str(raw).split('-')
        return date(int(year), int(month), 1)
    except (ValueError, TypeError):
        return None


class _LandlordAccountingView(APIView):
    """Accounting is the landlord's own books; a super admin may look via organization_id."""

    permission_classes = [IsAuthenticated]

    def organization(self, request):
        role = get_canonical_role(request.user)
        org_id = request.query_params.get('organization_id') or request.data.get('organization_id') if hasattr(request, 'data') else None
        if role == 'landlord':
            owned = Organization.objects.filter(owner=request.user)
            return (owned.filter(id=org_id).first() if org_id else owned.order_by('created_at').first())
        if role == 'super_admin' and org_id:
            return Organization.objects.filter(id=org_id).first()
        return None

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        from rest_framework.exceptions import NotFound, PermissionDenied

        if get_canonical_role(request.user) not in ('landlord', 'super_admin'):
            raise PermissionDenied('Accounting is for landlords.')
        self.org = self.organization(request)
        if self.org is None:
            raise NotFound('No organization found.')


# --- MRI ---------------------------------------------------------------------

class MriMonthView(_LandlordAccountingView):
    """GET ?month=YYYY-MM (defaults to last month): the figures to declare for that month."""

    def get(self, request):
        month = parse_month(request.query_params.get('month'))
        if month is None:
            first_of_this = timezone.localdate().replace(day=1)
            month = date(first_of_this.year - (first_of_this.month == 1), 12 if first_of_this.month == 1 else first_of_this.month - 1, 1)
        return Response(services.mri_for_month(self.org, month))


class MriYearView(_LandlordAccountingView):
    def get(self, request):
        try:
            year = int(request.query_params.get('year') or timezone.localdate().year)
        except ValueError:
            return Response({'detail': 'Enter a valid year.'}, status=status.HTTP_400_BAD_REQUEST)
        if not 2000 <= year <= 2100:
            return Response({'detail': 'Enter a valid year.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(services.mri_for_year(self.org, year))


class MriFiledView(_LandlordAccountingView):
    """POST marks a month as filed and paid (with an optional receipt reference); DELETE undoes it."""

    def post(self, request, month):
        first = parse_month(month)
        if first is None:
            return Response({'detail': 'Use a month like 2026-09.'}, status=status.HTTP_400_BAD_REQUEST)
        if first >= timezone.localdate().replace(day=1):
            return Response({'detail': 'That month has not finished yet.'}, status=status.HTTP_400_BAD_REQUEST)
        reference = str(request.data.get('reference') or '').strip()[:100]
        figures = services.mri_for_month(self.org, first)
        MriFiling.objects.update_or_create(
            organization=self.org, month=first,
            defaults={
                'gross_rent': figures['gross_rent'], 'rate': figures['rate'], 'mri_amount': figures['mri_due'],
                'filed_on': timezone.localdate(), 'reference': reference, 'marked_by': request.user,
            },
        )
        log_audit('mri_marked_filed', actor=request.user, organization=self.org,
                  metadata={'month': first.isoformat(), 'mri': figures['mri_due']})
        return Response(services.mri_for_month(self.org, first))

    def delete(self, request, month):
        first = parse_month(month)
        if first is None:
            return Response({'detail': 'Use a month like 2026-09.'}, status=status.HTTP_400_BAD_REQUEST)
        deleted, _ = MriFiling.objects.filter(organization=self.org, month=first).delete()
        if deleted:
            log_audit('mri_unmarked_filed', actor=request.user, organization=self.org, metadata={'month': first.isoformat()})
        return Response(services.mri_for_month(self.org, first))


class TaxProfileView(_LandlordAccountingView):
    """The landlord's KRA PIN, for their worksheet. Never ask for or store an iTax password."""

    def _data(self):
        profile = OrganizationTaxProfile.objects.filter(organization=self.org).first()
        config = TaxRateConfig.get()
        return {
            'kra_pin': profile.kra_pin if profile else '',
            'mri_rate': str(config.mri_rate),
            'annual_min': str(config.mri_annual_min),
            'annual_max': str(config.mri_annual_max),
            'filing_due_day': config.filing_due_day,
        }

    def get(self, request):
        return Response(self._data())

    def put(self, request):
        pin = str(request.data.get('kra_pin') or '').strip().upper()
        profile, _ = OrganizationTaxProfile.objects.get_or_create(organization=self.org)
        profile.kra_pin = pin
        try:
            profile.full_clean(exclude=['organization'])
        except DjangoValidationError as exc:
            return Response({'detail': exc.message_dict['kra_pin'][0], 'errors': {'kra_pin': exc.message_dict['kra_pin'][0]}},
                            status=status.HTTP_400_BAD_REQUEST)
        profile.save()
        log_audit('kra_pin_updated', actor=request.user, organization=self.org)
        return Response(self._data())


# --- summary -----------------------------------------------------------------

class SummaryView(_LandlordAccountingView):
    """GET ?month=YYYY-MM (or ?year=YYYY): income, expenses and net, overall and per property."""

    def get(self, request):
        month = parse_month(request.query_params.get('month'))
        if month is not None:
            return Response(services.summary(self.org, month, services.next_month(month)))
        try:
            year = int(request.query_params.get('year') or timezone.localdate().year)
        except ValueError:
            return Response({'detail': 'Enter a valid year or month.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(services.summary(self.org, date(year, 1, 1), date(year + 1, 1, 1)))


# --- expenses ----------------------------------------------------------------

def _expense_data(expense, request) -> dict:
    return {
        'id': str(expense.id),
        'property': str(expense.parent_property_id) if expense.parent_property_id else None,
        'property_name': expense.parent_property.name if expense.parent_property_id else '',
        'category': expense.category,
        'category_label': expense.get_category_display(),
        'amount': str(services.money(expense.amount)),
        'incurred_on': expense.incurred_on.isoformat(),
        'vendor': expense.vendor,
        'description': expense.description,
        'receipt_url': request.build_absolute_uri(expense.receipt.url) if expense.receipt else None,
        'paid_from': expense.paid_from,
        'reference': expense.reference,
        'supplier_ref': str(expense.supplier_ref_id) if expense.supplier_ref_id else None,
        'is_void': expense.is_void,
        'void_reason': expense.void_reason,
        'created_at': expense.created_at,
    }


class ExpensePagination(PageNumberPagination):
    page_size = 20


class ExpenseListCreateView(_LandlordAccountingView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        expenses = Expense.objects.filter(organization=self.org).select_related('parent_property')
        month = parse_month(request.query_params.get('month'))
        if month is not None:
            expenses = expenses.filter(incurred_on__gte=month, incurred_on__lt=services.next_month(month))
        category = request.query_params.get('category')
        if category in dict(Expense.CATEGORIES):
            expenses = expenses.filter(category=category)
        if request.query_params.get('property'):
            expenses = expenses.filter(parent_property_id=request.query_params['property'])
        if request.query_params.get('include_void') != 'true':
            expenses = expenses.filter(is_void=False)
        paginator = ExpensePagination()
        page = paginator.paginate_queryset(expenses, request, view=self)
        return paginator.get_paginated_response([_expense_data(e, request) for e in page])

    def post(self, request):
        expense = Expense(organization=self.org, recorded_by=request.user)
        errors = _apply_expense(expense, request.data, request.FILES, self.org, partial=False)
        if errors:
            return Response({'detail': 'Please fix the highlighted fields.', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
        ExpenseService.save_new(expense, request.user)
        log_audit('expense_recorded', actor=request.user, organization=self.org, entity=expense,
                  metadata={'amount': str(expense.amount), 'category': expense.category})
        return Response(_expense_data(expense, request), status=status.HTTP_201_CREATED)


class ExpenseDetailView(_LandlordAccountingView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def _get(self, pk):
        try:
            return Expense.objects.select_related('parent_property').filter(organization=self.org, pk=pk).first()
        except (ValueError, DjangoValidationError):
            return None

    def patch(self, request, pk):
        expense = self._get(pk)
        if expense is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if expense.is_void:
            return Response({'detail': 'A voided expense cannot be edited.'}, status=status.HTTP_400_BAD_REQUEST)
        errors = _apply_expense(expense, request.data, request.FILES, self.org, partial=True)
        if errors:
            return Response({'detail': 'Please fix the highlighted fields.', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
        try:
            ExpenseService.update(expense, request.user)
        except ExpenseError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        log_audit('expense_updated', actor=request.user, organization=self.org, entity=expense)
        return Response(_expense_data(expense, request))

    def delete(self, request, pk):
        """Books keep their history: this voids the expense with a reason instead of deleting it."""
        expense = self._get(pk)
        if expense is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        reason = str(request.data.get('reason') or request.query_params.get('reason') or '').strip()
        if not reason:
            return Response({'detail': 'Say why you are removing this expense.', 'errors': {'reason': 'Required.'}},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            expense = ExpenseService.void(expense, reason, request.user)
        except ExpenseError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        log_audit('expense_voided', actor=request.user, organization=self.org, entity=expense, metadata={'reason': reason[:300]})
        return Response(_expense_data(expense, request))


def _apply_expense(expense, data, files, org, partial: bool) -> dict:
    from decimal import Decimal, InvalidOperation

    errors = {}
    if not partial or 'amount' in data:
        try:
            amount = Decimal(str(data.get('amount')))
            if amount <= 0 or amount > Decimal('100000000'):
                raise InvalidOperation
            expense.amount = amount
        except (InvalidOperation, TypeError):
            errors['amount'] = 'Enter an amount greater than 0.'
    if not partial or 'category' in data:
        if data.get('category') not in dict(Expense.CATEGORIES):
            errors['category'] = 'Choose a category.'
        else:
            expense.category = data['category']
    if not partial or 'incurred_on' in data:
        try:
            when = date.fromisoformat(str(data.get('incurred_on')))
            if when > timezone.localdate():
                errors['incurred_on'] = 'The date cannot be in the future.'
            else:
                expense.incurred_on = when
        except ValueError:
            errors['incurred_on'] = 'Enter a valid date.'
    if 'property' in data:
        raw = data.get('property')
        if raw in (None, '', 'null'):
            expense.parent_property = None
        else:
            prop = Property.objects.filter(organization=org, pk=raw).first() if _is_uuid(raw) else None
            if prop is None:
                errors['property'] = 'Choose one of your properties.'
            else:
                expense.parent_property = prop
    if not partial or 'paid_from' in data:
        paid_from = data.get('paid_from') or 'cash'
        if paid_from not in dict(Expense.PAID_FROM_CHOICES):
            errors['paid_from'] = 'Choose how it was paid.'
        else:
            expense.paid_from = paid_from
    for field, limit in (('vendor', 150), ('description', 300), ('reference', 100)):
        if field in data:
            value = str(data.get(field) or '').strip()
            if len(value) > limit:
                errors[field] = f'Keep this under {limit} characters.'
            setattr(expense, field, value)
    if 'supplier_ref' in data:
        raw = data.get('supplier_ref')
        if raw in (None, '', 'null'):
            expense.supplier_ref = None
        else:
            supplier = Supplier.objects.filter(organization=org, pk=raw).first() if _is_uuid(raw) else None
            if supplier is None:
                errors['supplier_ref'] = 'Choose one of your suppliers.'
            else:
                expense.supplier_ref = supplier
                if not str(data.get('vendor') or '').strip():
                    expense.vendor = supplier.name
    upload = files.get('receipt') if files else None
    if upload is not None:
        extension = os.path.splitext(upload.name)[1].lower()
        if extension not in ALLOWED_RECEIPT_TYPES:
            errors['receipt'] = 'Upload a photo (JPG, PNG, WebP) or a PDF.'
        elif upload.size > MAX_RECEIPT_BYTES:
            errors['receipt'] = 'The receipt must be under 5 MB.'
        else:
            upload.name = f'{uuid.uuid4().hex}{extension}'  # unguessable, and never the user's file name
            expense.receipt = upload
    return errors


def _is_uuid(value) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except ValueError:
        return False


# --- export ------------------------------------------------------------------

class ExportView(_LandlordAccountingView):
    """
    GET ?kind=mri&year=2026 | ledger | quickbooks_bank | quickbooks_journal
        &from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive, for the ledger-style kinds)
    """

    def get(self, request):
        kind = request.query_params.get('kind', 'ledger')
        if kind == 'mri':
            try:
                year = int(request.query_params.get('year') or timezone.localdate().year)
            except ValueError:
                return Response({'detail': 'Enter a valid year.'}, status=status.HTTP_400_BAD_REQUEST)
            body, name = services.mri_year_csv(self.org, year), f'mri-{year}.csv'
        elif kind in ('ledger', 'quickbooks_bank', 'quickbooks_journal'):
            try:
                start = date.fromisoformat(request.query_params.get('from') or f'{timezone.localdate().year}-01-01')
                end = date.fromisoformat(request.query_params.get('to') or timezone.localdate().isoformat())
            except ValueError:
                return Response({'detail': 'Use dates like 2026-01-31.'}, status=status.HTTP_400_BAD_REQUEST)
            if end < start or (end - start).days > 1100:
                return Response({'detail': 'Choose a range of up to three years.'}, status=status.HTTP_400_BAD_REQUEST)
            exclusive_end = date.fromordinal(end.toordinal() + 1)
            builder = {'ledger': services.ledger_csv, 'quickbooks_bank': services.quickbooks_bank_csv,
                       'quickbooks_journal': services.quickbooks_journal_csv}[kind]
            body, name = builder(self.org, start, exclusive_end), f'{kind.replace("_", "-")}-{start}-to-{end}.csv'
        else:
            return Response({'detail': 'Unknown export.'}, status=status.HTTP_400_BAD_REQUEST)

        response = HttpResponse(body, content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{name}"'
        log_audit('accounting_exported', actor=request.user, organization=self.org, metadata={'kind': kind})
        return response
