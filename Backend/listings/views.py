"""
Public vacancy listings (EazzyRent 'marketing'): vacant, listed units of
active properties, automatically gone once a unit is let. No tenant or
landlord personal data is exposed — enquiries go to the landlord.
"""

import re
from decimal import Decimal, InvalidOperation

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from accounting.views import OwnerScopedView
from listings.models import ListingEnquiry
from properties.models import RentalUnit


def listed_units():
    # Exclude any unit with a current tenancy even if its status flag says
    # vacant — never advertise a home someone lives in.
    return RentalUnit.objects.filter(
        status='vacant', is_active=True, is_listed=True, parent_property__status='active',
    ).exclude(tenancies__status__in=('active', 'notice_period')).select_related('parent_property', 'organization')


def listing_data(unit: RentalUnit) -> dict:
    prop = unit.parent_property
    return {
        'id': str(unit.id), 'unit_type': unit.get_unit_type_display(), 'monthly_rent': str(unit.monthly_rent),
        'deposit': str(unit.deposit), 'amenities': unit.amenities, 'images': unit.images or prop.images,
        'property_name': prop.name, 'property_type': prop.get_property_type_display(), 'city': prop.city,
        'county': prop.county, 'description': prop.description, 'listed_by': unit.organization.name,
    }


class ListingSearchView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        units = listed_units()
        q = request.query_params
        if q.get('city'):
            units = units.filter(Q(parent_property__city__icontains=q['city']) | Q(parent_property__county__icontains=q['city']))
        if q.get('unit_type'):
            units = units.filter(unit_type=q['unit_type'])
        try:
            if q.get('min_rent'):
                units = units.filter(monthly_rent__gte=Decimal(q['min_rent']))
            if q.get('max_rent'):
                units = units.filter(monthly_rent__lte=Decimal(q['max_rent']))
        except InvalidOperation:
            return Response({'detail': 'Rent filters must be numbers.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response([listing_data(u) for u in units.order_by('monthly_rent')[:200]])


class ListingDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, pk):
        return Response(listing_data(get_object_or_404(listed_units(), pk=pk)))


class EnquiryThrottle(AnonRateThrottle):
    rate = '10/hour'


class EnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingEnquiry
        fields = ['name', 'phone', 'email', 'message']

    def validate_phone(self, value):
        digits = re.sub(r'\D', '', value)
        if not 9 <= len(digits) <= 12:
            raise serializers.ValidationError('Enter a valid phone number.')
        return value


class ListingEnquiryView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [EnquiryThrottle]

    def post(self, request, pk):
        unit = get_object_or_404(listed_units(), pk=pk)
        serializer = EnquirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        enquiry = serializer.save(unit=unit, organization=unit.organization)
        from rent.services.notifications import _deliver
        owner = unit.organization.owner
        text = (f'RumiaRent: enquiry for {unit.unit_number} at {unit.parent_property.name} from {enquiry.name}, '
                f'{enquiry.phone}. {enquiry.message[:200]}')
        try:
            _deliver(['email', 'in_app', 'sms'], email=owner.email, phone=getattr(owner, 'phone_number', ''), user=owner,
                     subject=f'New enquiry: {unit.unit_number}, {unit.parent_property.name}', body=text, sms=text,
                     kind='listing_enquiry', metadata={'enquiry_id': str(enquiry.pk)})
        except Exception:
            pass
        return Response({'detail': 'Thank you — the landlord will contact you.'}, status=status.HTTP_201_CREATED)


class EnquiryInboxView(OwnerScopedView):
    def get(self, request):
        org = self.organization(request)
        if org is None:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        enquiries = ListingEnquiry.objects.filter(organization=org).select_related('unit__parent_property')[:200]
        return Response([{
            'id': str(e.id), 'unit': e.unit.unit_number, 'property': e.unit.parent_property.name, 'name': e.name,
            'phone': e.phone, 'email': e.email, 'message': e.message, 'handled': e.handled, 'created_at': e.created_at,
        } for e in enquiries])

    def post(self, request):
        org = self.organization(request)
        if org is None:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        ListingEnquiry.objects.filter(organization=org, pk=request.data.get('id')).update(handled=True)
        return Response({'status': 'ok'})
