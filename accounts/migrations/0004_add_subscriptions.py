# Generated migration for subscription models

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import django.core.validators
import uuid
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_make_student_profile_fields_optional'),
    ]

    operations = [
        migrations.CreateModel(
            name='SubscriptionPlan',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('slug', models.SlugField(unique=True)),
                ('plan_type', models.CharField(choices=[('trial', 'Free Trial'), ('basic', 'Basic Plan'), ('medium', 'Medium Plan'), ('advanced', 'Advanced Plan')], max_length=20)),
                ('billing_type', models.CharField(choices=[('fixed', 'Fixed Monthly Fee'), ('revenue', 'Revenue-Based (% of rent)')], max_length=20)),
                ('fixed_price', models.DecimalField(decimal_places=2, default=Decimal('0.00'), help_text='Fixed monthly price (KES)', max_digits=10)),
                ('revenue_percentage', models.DecimalField(decimal_places=2, default=Decimal('0.00'), help_text='Percentage of rent revenue (for revenue-based plans)', max_digits=5, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('trial_duration_days', models.IntegerField(default=0, help_text='Trial period in days (0 = no trial)')),
                ('features', models.JSONField(default=dict, help_text='Plan features and limits')),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('sort_order', models.IntegerField(default=0, help_text='Display order')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'accounts_subscriptionplan',
                'ordering': ['sort_order', 'fixed_price'],
            },
        ),
        migrations.CreateModel(
            name='LandlordSubscription',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('status', models.CharField(choices=[('trial', 'Free Trial'), ('active', 'Active'), ('past_due', 'Past Due'), ('cancelled', 'Cancelled'), ('expired', 'Expired')], default='trial', max_length=20)),
                ('current_period_start', models.DateField()),
                ('current_period_end', models.DateField()),
                ('next_billing_date', models.DateField()),
                ('trial_start', models.DateField(blank=True, null=True)),
                ('trial_end', models.DateField(blank=True, null=True)),
                ('is_trial_used', models.BooleanField(default=False)),
                ('total_rent_collected_this_period', models.DecimalField(decimal_places=2, default=Decimal('0.00'), help_text='Total rent collected in current billing period', max_digits=12)),
                ('calculated_fee_this_period', models.DecimalField(decimal_places=2, default=Decimal('0.00'), help_text='Calculated subscription fee for current period', max_digits=10)),
                ('auto_renew', models.BooleanField(default=True)),
                ('cancel_at_period_end', models.BooleanField(default=False)),
                ('last_payment_date', models.DateField(blank=True, null=True)),
                ('last_payment_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cancelled_at', models.DateTimeField(blank=True, null=True)),
                ('cancellation_reason', models.TextField(blank=True)),
                ('landlord', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='subscription', to='accounts.landlordprofile')),
                ('plan', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='subscriptions', to='accounts.subscriptionplan')),
            ],
            options={
                'db_table': 'accounts_landlordsubscription',
            },
        ),
        migrations.CreateModel(
            name='SubscriptionPayment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('billing_period_start', models.DateField()),
                ('billing_period_end', models.DateField()),
                ('rent_revenue_amount', models.DecimalField(blank=True, decimal_places=2, help_text='Total rent collected (for revenue-based plans)', max_digits=12, null=True)),
                ('payment_method', models.CharField(default='paystack', max_length=50)),
                ('transaction_reference', models.CharField(max_length=100, unique=True)),
                ('paystack_reference', models.CharField(blank=True, max_length=100, null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('success', 'Success'), ('failed', 'Failed'), ('refunded', 'Refunded')], default='pending', max_length=20)),
                ('initiated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('failed_at', models.DateTimeField(blank=True, null=True)),
                ('failure_reason', models.TextField(blank=True)),
                ('metadata', models.JSONField(default=dict)),
                ('subscription', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='accounts.landlordsubscription')),
            ],
            options={
                'db_table': 'accounts_subscriptionpayment',
                'ordering': ['-initiated_at'],
            },
        ),
        migrations.CreateModel(
            name='FeatureAccess',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('can_create_hostels', models.BooleanField(default=True)),
                ('can_manage_rooms', models.BooleanField(default=True)),
                ('can_process_payments', models.BooleanField(default=True)),
                ('can_create_caretakers', models.BooleanField(default=True)),
                ('can_use_recurring_payments', models.BooleanField(default=False)),
                ('can_use_inventory_management', models.BooleanField(default=False)),
                ('can_view_basic_analytics', models.BooleanField(default=True)),
                ('can_access_marketplace', models.BooleanField(default=False)),
                ('can_view_advanced_analytics', models.BooleanField(default=False)),
                ('can_generate_custom_reports', models.BooleanField(default=False)),
                ('can_use_bulk_operations', models.BooleanField(default=False)),
                ('can_use_ai_features', models.BooleanField(default=False)),
                ('can_use_predictive_analytics', models.BooleanField(default=False)),
                ('can_use_smart_pricing', models.BooleanField(default=False)),
                ('can_use_api_access', models.BooleanField(default=False)),
                ('can_use_white_label', models.BooleanField(default=False)),
                ('can_auto_screen_tenants', models.BooleanField(default=False)),
                ('last_feature_sync', models.DateTimeField(auto_now=True)),
                ('landlord', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='feature_access', to='accounts.landlordprofile')),
            ],
            options={
                'db_table': 'accounts_featureaccess',
            },
        ),
        # Add indexes
        migrations.AddIndex(
            model_name='subscriptionplan',
            index=models.Index(fields=['slug'], name='idx_plan_slug'),
        ),
        migrations.AddIndex(
            model_name='subscriptionplan',
            index=models.Index(fields=['plan_type'], name='idx_plan_type'),
        ),
        migrations.AddIndex(
            model_name='subscriptionplan',
            index=models.Index(fields=['is_active'], name='idx_plan_active'),
        ),
        migrations.AddIndex(
            model_name='landlordsubscription',
            index=models.Index(fields=['landlord'], name='idx_sub_landlord'),
        ),
        migrations.AddIndex(
            model_name='landlordsubscription',
            index=models.Index(fields=['status'], name='idx_sub_status'),
        ),
        migrations.AddIndex(
            model_name='landlordsubscription',
            index=models.Index(fields=['next_billing_date'], name='idx_sub_billing'),
        ),
        migrations.AddIndex(
            model_name='landlordsubscription',
            index=models.Index(fields=['trial_end'], name='idx_sub_trial_end'),
        ),
        migrations.AddIndex(
            model_name='subscriptionpayment',
            index=models.Index(fields=['subscription'], name='idx_subpay_subscription'),
        ),
        migrations.AddIndex(
            model_name='subscriptionpayment',
            index=models.Index(fields=['status'], name='idx_subpay_status'),
        ),
        migrations.AddIndex(
            model_name='subscriptionpayment',
            index=models.Index(fields=['transaction_reference'], name='idx_subpay_txn_ref'),
        ),
        migrations.AddIndex(
            model_name='subscriptionpayment',
            index=models.Index(fields=['paid_at'], name='idx_subpay_paid_at'),
        ),
        migrations.AddIndex(
            model_name='featureaccess',
            index=models.Index(fields=['landlord'], name='idx_feature_landlord'),
        ),
        # Add constraints
        migrations.AddConstraint(
            model_name='landlordsubscription',
            constraint=models.CheckConstraint(
                check=models.Q(current_period_end__gte=models.F('current_period_start')),
                name='check_period_dates'
            ),
        ),
    ]