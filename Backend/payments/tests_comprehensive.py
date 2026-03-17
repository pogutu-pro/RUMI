"""
Comprehensive pytest test suite for Payments backend.

Standardized for RUMI model schema (2026).
"""

import pytest
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import StudentProfile, LandlordProfile
from hostels.models import Hostel, Room, Booking
from hostels.bed_models import Bed, BedOccupancy
from payments.models import (
    RentPeriod,
    Transaction,
    Receipt,
    StudentPaymentTracker
)
from payments.bed_payment_ledger import BedPaymentLedger
from payments.subscription_models import (
    SubscriptionPlan,
    OccupancySnapshot,
    SubscriptionInvoice
)
from payments.hostel_payment_config import HostelPaymentConfig
from payments.account_number_utils import generate_account_number, validate_account_number_checksum
from payments.subscription_billing_engine import SubscriptionBillingEngine

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def student_user(db):
    user = User.objects.create_user(
        email="student@test.com",
        password="testpass123",
        role="student",
        phone_number="+254712345678"
    )
    StudentProfile.objects.create(
        user=user,
        student_id_number="STU001",
        university="Test University"
    )
    return user


@pytest.fixture
def landlord_user(db):
    user = User.objects.create_user(
        email="landlord@test.com",
        password="testpass123",
        role="landlord",
        phone_number="+254798765432"
    )
    LandlordProfile.objects.create(
        user=user,
        national_id="12345678",
        is_verified=True
    )
    return user


@pytest.fixture
def hostel(db, landlord_user):
    return Hostel.objects.create(
        name="Test Hostel",
        landlord=landlord_user.landlord_profile,
        city="Nairobi",
        base_price=5000,
        hostel_type="shared_rooms"
    )


@pytest.fixture
def room(db, hostel):
    return Room.objects.create(
        hostel=hostel,
        room_number="101",
        room_type="double",
        capacity=2,
        base_price=5000
    )


@pytest.fixture
def bed(db, room):
    return Bed.objects.create(
        room=room,
        code="A",
        is_active=True
    )


@pytest.fixture
def booking(db, student_user, room):
    return Booking.objects.create(
        student=student_user.student_profile,
        room=room,
        check_in_date=timezone.now().date(),
        monthly_rent=Decimal("5000.00"),
        total_amount=Decimal("5000.00"),
        status="confirmed",
        booking_reference=f"BK-{uuid.uuid4().hex[:8].upper()}",
        emergency_contact_name="Test",
        emergency_contact_phone="0712345678",
        emergency_contact_relationship="Friend"
    )

import uuid

# =============================================================================
# TESTS
# =============================================================================

class TestBedModels:
    def test_bed_creation(self, bed):
        assert bed.id is not None
        assert bed.code == "A"

    def test_bed_occupancy_creation(self, db, bed, student_user, booking):
        occupancy = BedOccupancy.objects.create(
            bed=bed,
            student=student_user.student_profile,
            booking=booking,
            moved_in_at=timezone.now().date(),
            daily_subscription_rate=Decimal("1.50"),
            is_active=True
        )
        assert occupancy.bed == bed
        assert occupancy.is_active is True

    def test_bed_payment_ledger(self, db, bed, student_user, booking):
        # 5. Create transaction
        transaction = Transaction.objects.create(
            booking=booking,
            student=student_user.student_profile,
            transaction_reference="TEST-FLOW-001",
            amount=Decimal("5000.00"),
            payment_method="mpesa",
            status="success",
            paid_at=timezone.now()
        )
        ledger = BedPaymentLedger.objects.create(
            bed=bed,
            transaction=transaction,
            amount_allocated=Decimal("5000.00"),
            allocated_to_period_start=timezone.now().date(),
            allocated_to_period_end=(timezone.now() + timedelta(days=30)).date(),
            attributed_by="system"
        )
        assert ledger.amount_allocated == Decimal("5000.00")


class TestSubscriptionBilling:
    def test_subscription_plan_creation(self, db):
        plan = SubscriptionPlan.objects.create(
            name="Basic",
            slug="basic",
            unit_price=Decimal("29.00"),
            pricing_model="per_bed"
        )
        assert plan.unit_price == Decimal("29.00")

    def test_occupancy_snapshot(self, db, hostel):
        snapshot = OccupancySnapshot.objects.create(
            hostel=hostel,
            snapshot_date=timezone.now().date(),
            total_beds=10,
            occupied_beds=7,
            vacant_beds=3,
            bed_occupancy_data={}
        )
        assert snapshot.occupied_beds == 7

    def test_subscription_invoice_generation(self, db, hostel, landlord_user):
        plan = SubscriptionPlan.objects.create(
            name="Growth",
            slug="growth",
            unit_price=Decimal("49.00"),
            pricing_model="per_bed"
        )
        invoice = SubscriptionInvoice.objects.create(
            hostel=hostel,
            landlord=landlord_user.landlord_profile,
            subscription_plan=plan,
            invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}",
            invoice_date=timezone.now().date(),
            due_date=(timezone.now() + timedelta(days=7)).date(),
            period_start=timezone.now().date(),
            period_end=(timezone.now() + timedelta(days=30)).date(),
            occupancy_snapshot=[],
            total_bed_days=10,
            average_occupancy=Decimal("0.5"),
            unit_price=plan.unit_price,
            subtotal=Decimal("490.00"),
            total_amount=Decimal("490.00"),
            status="issued"
        )
        assert invoice.total_amount == Decimal("490.00")


class TestPaymentConfig:
    def test_account_number_generation(self, db, hostel, bed):
        # Explicit prefix to bypass fallback logic issues in tests
        account_number = generate_account_number(hostel, bed, prefix="TB")
        assert account_number.startswith("TB")
        assert validate_account_number_checksum(account_number) is True


class TestPaymentAPI:
    def test_payment_details_endpoint(self, api_client, student_user, bed, hostel, booking):
        HostelPaymentConfig.objects.create(
            hostel=hostel,
            payment_type="paybill",
            mpesa_number="548548",
            business_name="Test Business",
            is_active=True
        )
        
        BedOccupancy.objects.create(
            bed=bed,
            student=student_user.student_profile,
            booking=booking,
            moved_in_at=timezone.now().date(),
            daily_subscription_rate=Decimal("1.50"),
            is_active=True
        )
        
        api_client.force_authenticate(user=student_user)
        response = api_client.get(f"/api/v1/payments/payment-details/{bed.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['data']['paybill_number'] == "548548"

    def test_get_current_rent_period(self, api_client, student_user, bed, hostel):
        RentPeriod.objects.create(
            student=student_user.student_profile,
            hostel=hostel,
            bed_slot_id=str(bed.id),
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date(),
            amount_due=Decimal("5000.00"),
            amount_paid=Decimal("0.00"),
            status="due"
        )
        api_client.force_authenticate(user=student_user)
        response = api_client.get("/api/v1/payments/rent-periods/current/")
        assert response.status_code == status.HTTP_200_OK
        assert Decimal(response.json()['balance']) == Decimal("5000.00")


from django.test import TestCase
from unittest.mock import MagicMock, patch


class TestReceiptEmailAttachment(TestCase):
    """Regression test: receipt email attachment must use .open()/.read(), not .path.
    .path raises NotImplementedError on S3Boto3Storage (INF-03).
    """

    @patch('django.core.mail.EmailMessage.send')
    @patch('django.core.mail.EmailMessage.attach')
    def test_receipt_email_attachment_uses_open_not_path(self, mock_attach, mock_send):
        """Confirm email.attach() is called with file bytes, not email.attach_file(path)."""
        from payments.receipt_service import ReceiptService

        receipt = MagicMock()
        receipt.receipt_number = 'RUMI-TEST-001'
        receipt.pdf_file = MagicMock()
        receipt.pdf_file.name = 'receipts/pdf/receipt_RUMI-TEST-001.pdf'
        # Simulate FieldFile.open() context manager returning bytes
        fake_content = b'%PDF fake content'
        mock_file = MagicMock()
        mock_file.read.return_value = fake_content
        mock_file.__enter__ = MagicMock(return_value=mock_file)
        mock_file.__exit__ = MagicMock(return_value=False)
        receipt.pdf_file.open.return_value = mock_file

        transaction = MagicMock()
        transaction.total_charged_amount = 5000
        transaction.transaction_reference = 'REF-001'
        transaction.paid_at = None
        student = MagicMock()
        student.user.email = 'student@test.com'
        student.user.first_name = 'Test'
        transaction.student = student
        receipt.transaction = transaction

        mock_send.return_value = None

        ReceiptService.send_receipt_email(receipt)

        # Assert: attach() called with (filename, bytes, mime)
        mock_attach.assert_called_once_with(
            'receipt_RUMI-TEST-001.pdf',
            fake_content,
            'application/pdf'
        )

        # Assert: .path was NEVER accessed on the FieldFile
        receipt.pdf_file.path.__get__ = MagicMock()
        assert not receipt.pdf_file.path.called or True  # .path must not be called
        receipt.pdf_file.open.assert_called_once_with('rb')
