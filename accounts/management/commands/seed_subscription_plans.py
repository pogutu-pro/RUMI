"""
Management command to seed subscription plans
Usage: python manage.py seed_subscription_plans
"""
from django.core.management.base import BaseCommand
from accounts.subscription_models import SubscriptionPlan
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seed subscription plans for RUMI platform'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding subscription plans...'))
        
        plans_data = [
            {
                'name': 'Free Trial',
                'slug': 'free-trial',
                'plan_type': 'trial',
                'billing_type': 'fixed',
                'fixed_price': Decimal('0.00'),
                'revenue_percentage': Decimal('0.00'),
                'trial_duration_days': 30,
                'description': '1 month free trial with full access to all features. Perfect for first-time landlords to experience the platform.',
                'sort_order': 1,
                'features': {
                    'all_features': True,
                    'unlimited_access': True,
                    'hostels': 'unlimited',
                    'rooms': 'unlimited',
                    'caretakers': 'unlimited',
                    'recurring_payments': True,
                    'inventory_management': True,
                    'basic_analytics': True,
                    'advanced_analytics': True,
                    'marketplace': True,
                    'custom_reports': True,
                    'bulk_operations': True,
                    'ai_features': True,
                    'predictive_analytics': True,
                    'smart_pricing': True,
                    'api_access': True,
                    'white_label': True,
                    'auto_screening': True,
                }
            },
            {
                'name': 'Basic Plan',
                'slug': 'basic-plan',
                'plan_type': 'basic',
                'billing_type': 'fixed',
                'fixed_price': Decimal('10000.00'),
                'revenue_percentage': Decimal('0.00'),
                'trial_duration_days': 0,
                'description': 'KES 10,000 per month. All core features for managing your hostels effectively. Best for small to medium hostels with steady operations.',
                'sort_order': 2,
                'features': {
                    'hostels': 'unlimited',
                    'rooms': 'unlimited',
                    'caretakers': 'unlimited',
                    'recurring_payments': True,
                    'inventory_management': True,
                    'basic_analytics': True,
                    'advanced_analytics': False,
                    'marketplace': False,
                    'custom_reports': False,
                    'bulk_operations': False,
                    'ai_features': False,
                    'predictive_analytics': False,
                    'smart_pricing': False,
                    'api_access': False,
                    'white_label': False,
                    'auto_screening': False,
                }
            },
            {
                'name': 'Medium Plan',
                'slug': 'medium-plan',
                'plan_type': 'medium',
                'billing_type': 'fixed',
                'fixed_price': Decimal('30000.00'),
                'revenue_percentage': Decimal('0.00'),
                'trial_duration_days': 0,
                'description': 'KES 30,000 per month. Advanced features for growing hostels. Includes marketplace access, advanced analytics, and priority support.',
                'sort_order': 3,
                'features': {
                    'hostels': 'unlimited',
                    'rooms': 'unlimited',
                    'caretakers': 'unlimited',
                    'recurring_payments': True,
                    'inventory_management': True,
                    'basic_analytics': True,
                    'advanced_analytics': True,
                    'marketplace': True,
                    'custom_reports': True,
                    'bulk_operations': True,
                    'ai_features': False,
                    'predictive_analytics': False,
                    'smart_pricing': False,
                    'api_access': False,
                    'white_label': False,
                    'auto_screening': False,
                }
            },
            {
                'name': 'Advanced Plan',
                'slug': 'advanced-plan',
                'plan_type': 'advanced',
                'billing_type': 'fixed',
                'fixed_price': Decimal('40000.00'),
                'revenue_percentage': Decimal('0.00'),
                'trial_duration_days': 0,
                'description': 'KES 40,000 per month. Enterprise-grade features with AI-powered insights, predictive analytics, API access, and dedicated support. Best for large hostel chains.',
                'sort_order': 4,
                'features': {
                    'hostels': 'unlimited',
                    'rooms': 'unlimited',
                    'caretakers': 'unlimited',
                    'recurring_payments': True,
                    'inventory_management': True,
                    'basic_analytics': True,
                    'advanced_analytics': True,
                    'marketplace': True,
                    'custom_reports': True,
                    'bulk_operations': True,
                    'ai_features': True,
                    'predictive_analytics': True,
                    'smart_pricing': True,
                    'api_access': True,
                    'white_label': True,
                    'auto_screening': True,
                }
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for plan_data in plans_data:
            plan, created = SubscriptionPlan.objects.update_or_create(
                slug=plan_data['slug'],
                defaults=plan_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created: {plan.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated: {plan.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Seeding complete: {created_count} created, {updated_count} updated'
            )
        )
        
        # Display plan summary
        self.stdout.write(self.style.SUCCESS('\n=== Subscription Plans Summary ==='))
        for plan in SubscriptionPlan.objects.all().order_by('sort_order'):
            if plan.billing_type == 'fixed':
                price_display = f'KES {plan.fixed_price:,.2f}/month'
            else:
                price_display = f'{plan.revenue_percentage}% of rent revenue'
            
            self.stdout.write(
                f'\n{plan.name}:\n'
                f'  - Type: {plan.get_plan_type_display()}\n'
                f'  - Price: {price_display}\n'
                f'  - Status: {"Active" if plan.is_active else "Inactive"}'
            )