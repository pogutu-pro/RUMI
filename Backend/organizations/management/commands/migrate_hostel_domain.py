"""
Migrate legacy hostel domain data into RUMIA canonical models.

SAFE BY DEFAULT — runs dry-run unless --execute is passed.

Migration mapping:
  Hostel → Property (1:1 via legacy_hostel FK)
  Room → RentalUnit (1:1 — NOT one unit per bed)
  Booking → Tenancy (active/confirmed/checked_in bookings)
  StudentProfile → TenantProfile
  RentPeriod → RentCharge
  Transaction → Payment (successful rent transactions)

Run against staging copy first. Never run --execute on production without backup.
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import LandlordProfile, StudentProfile, User
from hostels.models import Booking, Hostel, Room
from organizations.models import Organization, OrganizationMembership
from payments.models import RentPeriod, Transaction
from properties.models import Property, RentalUnit, Tenancy
from rent.models import Payment, PaymentAllocation, RentCharge
from tenants.models import EscalationPolicy, TenantProfile


HOSTEL_TO_PROPERTY_TYPE = {
    'single_rooms': 'apartment',
    'shared_rooms': 'apartment',
    'mixed': 'apartment',
}

ROOM_TO_UNIT_TYPE = {
    'single': '1_bedroom',
    'double': '2_bedroom',
    'triple': '3_bedroom',
    'quad': '4_bedroom',
}

BOOKING_TO_TENANCY_STATUS = {
    'pending': 'pending',
    'confirmed': 'active',
    'checked_in': 'active',
    'inspection_pending': 'active',
    'completed': 'expired',
    'cancelled': 'terminated',
    'expired': 'expired',
}


class Command(BaseCommand):
    help = 'Migrate legacy hostel data to RUMIA domain models (dry-run by default)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--execute',
            action='store_true',
            help='Apply changes (default is dry-run)',
        )
        parser.add_argument(
            '--organization-id',
            type=str,
            default=None,
            help='Migrate only hostels belonging to this organization',
        )

    def handle(self, *args, **options):
        execute = options['execute']
        self.stdout.write(
            self.style.WARNING('DRY RUN') if not execute else self.style.SUCCESS('EXECUTE MODE')
        )

        stats = {
            'organizations': 0,
            'properties': 0,
            'units': 0,
            'tenants': 0,
            'tenancies': 0,
            'rent_charges': 0,
            'payments': 0,
            'skipped_hostels': 0,
            'skipped_rooms': 0,
        }

        landlord_profiles = LandlordProfile.objects.select_related('user').all()

        for landlord in landlord_profiles:
            self._migrate_landlord(landlord, stats, execute)

        if execute:
            self._finalize_financials(stats, execute)
        else:
            self._migrate_financials(stats, execute=False)

        self.stdout.write(self.style.SUCCESS('\nMigration summary:'))
        for key, val in stats.items():
            self.stdout.write(f'  {key}: {val}')

        if not execute:
            self.stdout.write(
                self.style.WARNING('\nDry run complete. Pass --execute to apply changes.')
            )

    def _migrate_landlord(self, landlord, stats, execute):
        hostels = Hostel.objects.filter(landlord=landlord, deleted_at__isnull=True)
        if not hostels.exists():
            return

        if execute:
            with transaction.atomic():
                org = self._ensure_organization(landlord, stats)
                for hostel in hostels:
                    self._migrate_hostel(hostel, org, stats, execute=True)
        else:
            org = None
            for hostel in hostels:
                self._migrate_hostel(hostel, org, stats, execute=False)

    def _ensure_organization(self, landlord, stats):
        org = Organization.objects.filter(legacy_landlord_profile=landlord).first()
        if org:
            return org

        name = landlord.company_name or landlord.user.get_full_name()
        org = Organization.objects.create(
            name=name,
            organization_type='individual',
            owner=landlord.user,
            legacy_landlord_profile=landlord,
        )
        OrganizationMembership.objects.get_or_create(
            organization=org,
            user=landlord.user,
            defaults={'role': 'owner'},
        )
        EscalationPolicy.objects.get_or_create(organization=org)
        stats['organizations'] += 1
        return org

    def _migrate_hostel(self, hostel, org, stats, execute):
        if Property.objects.filter(legacy_hostel=hostel).exists():
            stats['skipped_hostels'] += 1
            return

        stats['properties'] += 1
        if not execute:
            rooms = Room.objects.filter(hostel=hostel, deleted_at__isnull=True)
            stats['units'] += rooms.count()
            return

        prop = Property.objects.create(
            organization=org,
            legacy_hostel=hostel,
            name=hostel.name,
            property_type=HOSTEL_TO_PROPERTY_TYPE.get(hostel.hostel_type, 'apartment'),
            description=hostel.description,
            address=hostel.address,
            city=hostel.city,
            status='active' if hostel.status == 'active' else 'under_maintenance',
            default_monthly_rent=hostel.base_price,
            currency=hostel.currency,
            total_units=hostel.total_rooms,
            images=hostel.images or [],
        )

        for room in Room.objects.filter(hostel=hostel, deleted_at__isnull=True):
            self._migrate_room(room, prop, org, stats, execute=True)

        if execute:
            for booking in Booking.objects.filter(room__hostel=hostel):
                self._migrate_booking(booking, stats, execute=True)

    def _finalize_financials(self, stats, execute):
        self._migrate_financials(stats, execute)

    def _migrate_room(self, room, prop, org, stats, execute):
        if RentalUnit.objects.filter(legacy_room=room).exists():
            stats['skipped_rooms'] += 1
            return

        stats['units'] += 1
        if not execute:
            return

        status_map = {
            'available': 'vacant',
            'occupied': 'occupied',
            'under_maintenance': 'maintenance',
            'reserved': 'reserved',
        }

        RentalUnit.objects.create(
            organization=org,
            parent_property=prop,
            legacy_room=room,
            unit_number=room.room_number,
            unit_type=ROOM_TO_UNIT_TYPE.get(room.room_type, 'other'),
            monthly_rent=room.base_price,
            deposit=room.deposit_required,
            status=status_map.get(room.status, 'vacant'),
            floor=room.floor,
            amenities=room.amenities or [],
            images=room.images or [],
        )

    def _migrate_booking(self, booking, stats, execute):
        if Tenancy.objects.filter(legacy_booking=booking).exists():
            return

        unit = RentalUnit.objects.filter(legacy_room=booking.room).first()
        if not unit:
            return

        tenant_profile = self._ensure_tenant(booking.student, unit.organization, stats, execute)
        if not execute:
            stats['tenancies'] += 1
            return

        tenancy_status = BOOKING_TO_TENANCY_STATUS.get(booking.status, 'pending')
        Tenancy.objects.create(
            organization=unit.organization,
            parent_property=unit.parent_property,
            unit=unit,
            tenant=tenant_profile,
            legacy_booking=booking,
            start_date=booking.check_in_date,
            end_date=booking.check_out_date,
            move_in_date=booking.move_in_date or booking.check_in_date,
            monthly_rent=booking.monthly_rent,
            deposit=booking.room.deposit_required,
            rent_due_day=5,
            status=tenancy_status,
        )
        if tenancy_status == 'active':
            unit.status = 'occupied'
            unit.save(update_fields=['status', 'updated_at'])
        stats['tenancies'] += 1

    def _ensure_tenant(self, student: StudentProfile, org, stats, execute):
        existing = TenantProfile.objects.filter(legacy_student_profile=student).first()
        if existing:
            return existing

        stats['tenants'] += 1
        if not execute:
            return None

        return TenantProfile.objects.create(
            organization=org,
            user=student.user,
            legacy_student_profile=student,
            full_name=student.user.get_full_name(),
            phone=student.user.phone_number or '',
            email=student.user.email,
            national_id=student.student_id_number or '',
            status='active',
        )

    def _migrate_financials(self, stats, execute):
        """Migrate RentPeriod → RentCharge and Transaction → Payment."""
        for period in RentPeriod.objects.select_related('student', 'hostel', 'room').all():
            if RentCharge.objects.filter(legacy_rent_period=period).exists():
                continue

            unit = RentalUnit.objects.filter(legacy_room=period.room).first() if period.room_id else None
            tenant = TenantProfile.objects.filter(
                legacy_student_profile=period.student
            ).first()
            if not unit or not tenant:
                continue

            tenancy = Tenancy.objects.filter(
                tenant=tenant, unit=unit, legacy_booking__isnull=False
            ).first()

            stats['rent_charges'] += 1
            if not execute:
                continue

            status_map = {
                'due': 'due',
                'partially_paid': 'partially_paid',
                'paid': 'paid',
                'overdue': 'overdue',
                'transferred': 'waived',
            }

            RentCharge.objects.create(
                organization=unit.organization,
                tenancy=tenancy,
                parent_property=unit.parent_property,
                unit=unit,
                tenant=tenant,
                legacy_rent_period=period,
                period_start=period.start_date,
                period_end=period.end_date,
                due_date=period.start_date,
                amount_due=period.amount_due,
                amount_paid=period.amount_paid,
                status=status_map.get(period.status, 'due'),
            )

        for txn in Transaction.objects.filter(status='success').select_related('student'):
            if Payment.objects.filter(legacy_transaction=txn).exists():
                continue

            tenant = TenantProfile.objects.filter(
                legacy_student_profile=txn.student
            ).first()
            if not tenant:
                continue

            stats['payments'] += 1
            if not execute:
                continue

            payment = Payment.objects.create(
                organization=tenant.organization,
                tenant=tenant,
                amount=txn.amount,
                currency='KES',
                payment_method=txn.payment_method,
                provider=txn.payment_method,
                provider_reference=txn.paystack_reference or txn.transaction_reference,
                internal_reference=f'MIG-{txn.transaction_reference}',
                status='success',
                paid_at=txn.paid_at,
                legacy_transaction=txn,
            )

            charge = RentCharge.objects.filter(
                legacy_rent_period=txn.rent_period
            ).first() if txn.rent_period_id else None
            if charge:
                PaymentAllocation.objects.create(
                    payment=payment,
                    rent_charge=charge,
                    amount=txn.amount,
                )
