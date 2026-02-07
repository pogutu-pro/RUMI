# Generated migration - create default subscription plans

from django.db import migrations
from decimal import Decimal


def create_default_subscription_plans(apps, schema_editor):
    """
    Create default subscription plans with pricing tiers:
    - Starter: KES 29/bed/month
    - Growth: KES 49/bed/month  
    - Enterprise: KES 85/bed/month
    """
    SubscriptionPlan = apps.get_model('payments', 'SubscriptionPlan')
    
    # Starter plan (default)
    SubscriptionPlan.objects.get_or_create(
        slug='starter',
        defaults={
            'name': 'Starter',
            'description': 'Perfect for small hostels (up to 20 beds)',
            'pricing_model': 'per_bed',
            'unit_price': Decimal('29.00'),
            'currency': 'KES',
            'billing_frequency': 'monthly',
            'grace_period_days': 7,
            'enforcement_days': 14,
            'max_beds': 20,
            'features': {
                'basic_analytics': True,
                'email_support': True,
            },
            'is_active': True,
            'is_default': True,
        }
    )
    
    # Growth plan
    SubscriptionPlan.objects.get_or_create(
        slug='growth',
        defaults={
            'name': 'Growth',
            'description': 'For growing hostels (up to 100 beds)',
            'pricing_model': 'per_bed',
            'unit_price': Decimal('49.00'),
            'currency': 'KES',
            'billing_frequency': 'monthly',
            'grace_period_days': 10,
            'enforcement_days': 21,
            'max_beds': 100,
            'features': {
                'advanced_analytics': True,
                'priority_support': True,
                'custom_branding': True,
            },
            'is_active': True,
            'is_default': False,
        }
    )
    
    # Enterprise plan
    SubscriptionPlan.objects.get_or_create(
        slug='enterprise',
        defaults={
            'name': 'Enterprise',
            'description': 'For large hostels (unlimited beds)',
            'pricing_model': 'per_bed',
            'unit_price': Decimal('85.00'),
            'currency': 'KES',
            'billing_frequency': 'monthly',
            'grace_period_days': 14,
            'enforcement_days': 30,
            'max_beds': None,  # Unlimited
            'features': {
                'premium_analytics': True,
                'dedicated_support': True,
                'custom_branding': True,
                'api_access': True,
                'white_label': True,
            },
            'is_active': True,
            'is_default': False,
        }
    )


def reverse_create_plans(apps, schema_editor):
    """Remove default plans on migration rollback"""
    SubscriptionPlan = apps.get_model('payments', 'SubscriptionPlan')
    SubscriptionPlan.objects.filter(slug__in=['starter', 'growth', 'enterprise']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0014_create_subscription_models'),
    ]

    operations = [
        migrations.RunPython(create_default_subscription_plans, reverse_create_plans),
    ]
