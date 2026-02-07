import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from accounts.models import User
from payments.models import Transaction, PaymentAuditLog
from decimal import Decimal

@pytest.mark.django_db
class TestAdminPaymentStatsView:
    def setup_method(self):
        self.client = APIClient()
        
        # Create Admin User
        self.admin_user = User.objects.create_superuser(
            email='admin@rumi.co.ke',
            password='password123',
            first_name='Admin',
            last_name='User',
            role='tech_support'
        )
        self.client.force_authenticate(user=self.admin_user)
        
        # Create Dummy Transactions
        Transaction.objects.create(
            transaction_reference="TX-SUCCESS-001",
            amount=Decimal("1500.00"),
            status='success',
            provider='mpesa',
            mpesa_receipt_number="Q123456",
            created_at=timezone.now()
        )
        Transaction.objects.create(
            transaction_reference="TX-FAILED-001",
            amount=Decimal("500.00"),
            status='failed',
            provider='mpesa',
            metadata={'failure_reason': 'Insufficient Funds'},
            created_at=timezone.now()
        )
        # Create a stuck transaction (processing > 10 mins)
        stuck_tx = Transaction.objects.create(
            transaction_reference="TX-STUCK-001",
            amount=Decimal("2000.00"),
            status='processing',
            provider='mpesa',
            created_at=timezone.now() - timezone.timedelta(minutes=15)
        )
        # Manually update updated_at because auto_now updates it on save
        Transaction.objects.filter(id=stuck_tx.id).update(
             created_at=timezone.now() - timezone.timedelta(minutes=15)
        )

    def test_get_payment_stats(self):
        url = reverse('admin-payment-stats')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        
        # Verify structure
        assert 'health' in data
        assert 'stuck_count' in data
        assert 'feed' in data
        
        # Verify specific data points
        assert data['stuck_count'] >= 1
        assert len(data['feed']) >= 2
        assert data['health']['status'] in ['operational', 'degraded', 'outage']

    def test_permission_denied_for_non_admin(self):
        # Create regular user
        regular_user = User.objects.create_user(
            email='user@rumi.co.ke',
            password='password123',
            role='student',
            first_name='Regular',
            last_name='User'
        )
        self.client.force_authenticate(user=regular_user)
        
        url = reverse('admin-payment-stats')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
