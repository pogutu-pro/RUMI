"""
Billing app tests — plan catalog, subscribe (auto/manual), plan switching,
and feature-gating enforcement (GATE-01).
"""
from datetime import timedelta
from unittest.mock import patch

from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APIClient

from billing.models import OrganizationSubscription, SubscriptionPayment, SubscriptionPlan
from billing.providers.paystack_billing import PaystackBillingClient
from billing.services.gating_service import GatingService
from properties.models import Property
from rumia_api.tests import RumiaTestFixtures


class SeedSubscriptionPlansCommandTests(RumiaTestFixtures):
    def test_seed_is_idempotent_and_produces_three_tiers(self):
        call_command('seed_subscription_plans')
        call_command('seed_subscription_plans')

        self.assertEqual(SubscriptionPlan.objects.count(), 3)
        self.assertEqual(
            set(SubscriptionPlan.objects.values_list('slug', flat=True)),
            {'starter', 'pro', 'enterprise'},
        )


class SubscriptionPlanListViewTests(RumiaTestFixtures):
    def test_plans_endpoint_is_public_and_hides_paystack_plan_code(self):
        call_command('seed_subscription_plans')

        client = APIClient()
        response = client.get('/api/v1/billing/plans/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)
        for plan_data in response.data:
            self.assertNotIn('paystack_plan_code', plan_data)


class SubscribeFlowTests(RumiaTestFixtures):
    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def test_manual_subscribe_never_calls_paystack(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        with patch.object(PaystackBillingClient, 'initialize_subscription_transaction') as mock_init:
            response = client.post('/api/v1/billing/subscribe/', {
                'plan_id': str(plans['starter'].id), 'billing_mode': 'manual',
            })

        self.assertEqual(response.status_code, 201)
        mock_init.assert_not_called()

        subscription = OrganizationSubscription.objects.get(organization=org)
        self.assertEqual(subscription.status, 'active')
        self.assertEqual(subscription.billing_mode, 'manual')

    @patch.object(PaystackBillingClient, 'initialize_subscription_transaction')
    def test_auto_subscribe_creates_pending_payment_and_returns_authorization_url(self, mock_init):
        plans = self._seed_plans()
        plan = plans['pro']
        plan.paystack_plan_code = 'PLN_test123'
        plan.save(update_fields=['paystack_plan_code'])
        mock_init.return_value = {
            'authorization_url': 'https://checkout.paystack.com/xyz',
            'access_code': 'ac_xyz',
            'raw': {},
        }
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post('/api/v1/billing/subscribe/', {
            'plan_id': str(plan.id), 'billing_mode': 'auto',
        })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['authorization_url'], 'https://checkout.paystack.com/xyz')

        subscription = OrganizationSubscription.objects.get(organization=org)
        self.assertEqual(subscription.status, 'pending')

        payment = SubscriptionPayment.objects.get(subscription=subscription)
        self.assertEqual(payment.status, 'pending')
        self.assertEqual(payment.amount, plan.price)

    def test_non_landlord_cannot_subscribe(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        tenant_user, _ = self.create_tenant(org)

        client = APIClient()
        client.force_authenticate(user=tenant_user)
        response = client.post('/api/v1/billing/subscribe/', {
            'plan_id': str(plans['starter'].id), 'billing_mode': 'manual',
        })

        self.assertEqual(response.status_code, 403)

    def test_second_subscribe_for_already_active_org_is_rejected(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        first = client.post('/api/v1/billing/subscribe/', {
            'plan_id': str(plans['starter'].id), 'billing_mode': 'manual',
        })
        self.assertEqual(first.status_code, 201)

        second = client.post('/api/v1/billing/subscribe/', {
            'plan_id': str(plans['pro'].id), 'billing_mode': 'manual',
        })
        self.assertEqual(second.status_code, 400)
        self.assertEqual(OrganizationSubscription.objects.filter(organization=org).count(), 1)


class SwitchPlanTests(RumiaTestFixtures):
    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def _active_auto_subscription(self, org, plan):
        return OrganizationSubscription.objects.create(
            organization=org,
            plan=plan,
            status='active',
            billing_mode='auto',
            paystack_subscription_code='SUB_code_123',
            paystack_email_token='email_tok_123',
            current_period_start=timezone.now().date(),
            current_period_end=timezone.now().date(),
        )

    def test_switch_disables_old_subscription_before_initiating_new_one(self):
        plans = self._seed_plans()
        starter, pro = plans['starter'], plans['pro']
        pro.paystack_plan_code = 'PLN_pro'
        pro.save(update_fields=['paystack_plan_code'])
        user, profile, org = self.create_landlord_with_org()
        subscription = self._active_auto_subscription(org, starter)

        call_order = []
        with patch.object(PaystackBillingClient, 'disable_subscription') as mock_disable, \
                patch.object(PaystackBillingClient, 'initialize_subscription_transaction') as mock_init:
            mock_disable.side_effect = lambda *a, **k: call_order.append('disable') or {}
            mock_init.side_effect = lambda *a, **k: call_order.append('initiate') or {
                'authorization_url': 'https://checkout.paystack.com/switch',
                'access_code': '',
                'raw': {},
            }

            client = APIClient()
            client.force_authenticate(user=user)
            response = client.post('/api/v1/billing/switch-plan/', {'new_plan_id': str(pro.id)})

        self.assertEqual(response.status_code, 200)
        mock_disable.assert_called_once()
        mock_init.assert_called_once()
        self.assertEqual(call_order, ['disable', 'initiate'])

        subscription.refresh_from_db()
        self.assertEqual(subscription.plan_id, pro.id)
        self.assertEqual(subscription.paystack_subscription_code, '')

    def test_switch_to_same_plan_is_rejected(self):
        plans = self._seed_plans()
        starter = plans['starter']
        user, profile, org = self.create_landlord_with_org()
        self._active_auto_subscription(org, starter)

        with patch.object(PaystackBillingClient, 'disable_subscription') as mock_disable, \
                patch.object(PaystackBillingClient, 'initialize_subscription_transaction') as mock_init:
            client = APIClient()
            client.force_authenticate(user=user)
            response = client.post('/api/v1/billing/switch-plan/', {'new_plan_id': str(starter.id)})

        self.assertEqual(response.status_code, 400)
        mock_disable.assert_not_called()
        mock_init.assert_not_called()

    def test_switch_of_pending_subscription_is_rejected(self):
        plans = self._seed_plans()
        starter, pro = plans['starter'], plans['pro']
        user, profile, org = self.create_landlord_with_org()
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=starter, status='pending', billing_mode='auto',
        )

        with patch.object(PaystackBillingClient, 'disable_subscription') as mock_disable, \
                patch.object(PaystackBillingClient, 'initialize_subscription_transaction') as mock_init:
            client = APIClient()
            client.force_authenticate(user=user)
            response = client.post('/api/v1/billing/switch-plan/', {'new_plan_id': str(pro.id)})

        self.assertEqual(response.status_code, 400)
        mock_disable.assert_not_called()
        mock_init.assert_not_called()
        subscription.refresh_from_db()
        self.assertEqual(subscription.plan_id, starter.id)

    def test_switch_of_cancelled_subscription_is_rejected(self):
        plans = self._seed_plans()
        starter, pro = plans['starter'], plans['pro']
        user, profile, org = self.create_landlord_with_org()
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=starter, status='cancelled', billing_mode='auto',
        )

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post('/api/v1/billing/switch-plan/', {'new_plan_id': str(pro.id)})

        self.assertEqual(response.status_code, 400)
        subscription.refresh_from_db()
        self.assertEqual(subscription.plan_id, starter.id)

    def test_switch_manual_mode_updates_plan_without_paystack(self):
        plans = self._seed_plans()
        starter, pro = plans['starter'], plans['pro']
        user, profile, org = self.create_landlord_with_org()
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=starter, status='active', billing_mode='manual',
            current_period_start=timezone.now().date(), current_period_end=timezone.now().date(),
        )

        with patch.object(
            PaystackBillingClient, '__init__',
            side_effect=AssertionError('PaystackBillingClient must never be instantiated for a manual switch'),
        ):
            client = APIClient()
            client.force_authenticate(user=user)
            response = client.post('/api/v1/billing/switch-plan/', {'new_plan_id': str(pro.id)})

        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertEqual(subscription.plan_id, pro.id)

    def test_successful_auto_switch_leaves_exactly_one_subscription_row(self):
        plans = self._seed_plans()
        starter, pro = plans['starter'], plans['pro']
        pro.paystack_plan_code = 'PLN_pro'
        pro.save(update_fields=['paystack_plan_code'])
        user, profile, org = self.create_landlord_with_org()
        self._active_auto_subscription(org, starter)

        with patch.object(PaystackBillingClient, 'disable_subscription', return_value={}), \
                patch.object(PaystackBillingClient, 'initialize_subscription_transaction', return_value={
                    'authorization_url': 'https://checkout.paystack.com/switch',
                    'access_code': '',
                    'raw': {},
                }):
            client = APIClient()
            client.force_authenticate(user=user)
            response = client.post('/api/v1/billing/switch-plan/', {'new_plan_id': str(pro.id)})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(OrganizationSubscription.objects.filter(organization=org).count(), 1)


class MySubscriptionViewTests(RumiaTestFixtures):
    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def test_landlord_in_grace_period_sees_past_due_status_and_grace_period_ends_at(self):
        plans = self._seed_plans()
        starter = plans['starter']
        user, profile, org = self.create_landlord_with_org()
        grace_ends_at = timezone.now() + timezone.timedelta(days=3)
        OrganizationSubscription.objects.create(
            organization=org,
            plan=starter,
            status='past_due',
            billing_mode='auto',
            grace_period_ends_at=grace_ends_at,
            paystack_subscription_code='SUB_code_123',
            paystack_email_token='email_tok_123',
            paystack_customer_code='CUS_code_123',
        )

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get('/api/v1/billing/my-subscription/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'past_due')
        self.assertIsNotNone(response.data['grace_period_ends_at'])
        self.assertNotIn('paystack_subscription_code', response.data)
        self.assertNotIn('paystack_email_token', response.data)
        self.assertNotIn('paystack_customer_code', response.data)

    def test_landlord_with_no_subscription_gets_404_not_500(self):
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get('/api/v1/billing/my-subscription/')

        self.assertEqual(response.status_code, 404)
        self.assertIn('error', response.data)

    def test_non_landlord_non_super_admin_forbidden(self):
        user, profile, org = self.create_landlord_with_org()
        tenant_user, _ = self.create_tenant(org)

        client = APIClient()
        client.force_authenticate(user=tenant_user)
        response = client.get('/api/v1/billing/my-subscription/')

        self.assertEqual(response.status_code, 403)

    def test_landlord_cannot_see_another_orgs_subscription_via_organization_id_param(self):
        plans = self._seed_plans()
        starter = plans['starter']
        user_a, profile_a, org_a = self.create_landlord_with_org(email='landlord-a@test.com')
        user_b, profile_b, org_b = self.create_landlord_with_org(email='landlord-b@test.com')
        OrganizationSubscription.objects.create(
            organization=org_b, plan=starter, status='active', billing_mode='manual',
        )

        client = APIClient()
        client.force_authenticate(user=user_a)
        response = client.get(f'/api/v1/billing/my-subscription/?organization_id={org_b.id}')

        # Landlord A has no subscription of their own, and the org_id param
        # for org B must be ignored — never leaked as a 200 with org B's data.
        self.assertEqual(response.status_code, 404)


class GatingServiceEffectiveTierTests(RumiaTestFixtures):
    """D-01-D-04 effective-tier resolution."""

    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def test_no_subscription_within_trial_window_returns_enterprise(self):
        self._seed_plans()
        user, profile, org = self.create_landlord_with_org()

        plan = GatingService.get_effective_plan(org)

        self.assertEqual(plan.slug, 'enterprise')

    def test_no_subscription_after_trial_window_returns_starter(self):
        self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        org.created_at = timezone.now() - timedelta(days=31)
        org.save(update_fields=['created_at'])

        plan = GatingService.get_effective_plan(org)

        self.assertEqual(plan.slug, 'starter')

    def test_active_subscription_returns_subscribed_plan(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['pro'], status='active', billing_mode='manual',
        )

        plan = GatingService.get_effective_plan(org)

        self.assertEqual(plan.slug, 'pro')

    def test_past_due_within_grace_period_returns_subscribed_plan(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['pro'], status='past_due', billing_mode='manual',
            grace_period_ends_at=timezone.now() + timedelta(days=3),
        )

        plan = GatingService.get_effective_plan(org)

        self.assertEqual(plan.slug, 'pro')

    def test_past_due_after_grace_period_falls_back_to_floor(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        org.created_at = timezone.now() - timedelta(days=31)
        org.save(update_fields=['created_at'])
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['pro'], status='past_due', billing_mode='manual',
            grace_period_ends_at=timezone.now() - timedelta(days=1),
        )

        plan = GatingService.get_effective_plan(org)

        self.assertEqual(plan.slug, 'starter')

    def test_pending_subscription_treated_as_no_subscription(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        org.created_at = timezone.now() - timedelta(days=31)
        org.save(update_fields=['created_at'])
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['pro'], status='pending', billing_mode='manual',
        )

        plan = GatingService.get_effective_plan(org)

        self.assertEqual(plan.slug, 'starter')

    def test_suspended_subscription_falls_back_to_floor(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        org.created_at = timezone.now() - timedelta(days=31)
        org.save(update_fields=['created_at'])
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['pro'], status='suspended', billing_mode='manual',
        )

        plan = GatingService.get_effective_plan(org)

        self.assertEqual(plan.slug, 'starter')


class PropertyLimitGateTests(RumiaTestFixtures):
    """D-06/D-10 — property-limit gate wired into PropertyListCreateView.post."""

    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def _property_payload(self, name='New Property'):
        return {
            'name': name,
            'property_type': 'apartment',
            'address': '456 Test Ave',
            'city': 'Nairobi',
        }

    def test_property_creation_blocked_at_starter_cap_returns_403_with_d10_body(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['starter'], status='active', billing_mode='manual',
        )
        self.create_property_with_unit(org)  # starter cap is 1 property — already at cap

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post('/api/v1/properties/', self._property_payload())

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data, {
            'detail': 'Property limit reached for your plan.',
            'gate': 'max_properties',
            'current_tier': 'starter',
            'required_tier': 'pro',
        })

    def test_property_creation_allowed_under_cap(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['pro'], status='active', billing_mode='manual',
        )

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post('/api/v1/properties/', self._property_payload())

        self.assertEqual(response.status_code, 201)

    def test_enterprise_zero_sentinel_means_unlimited_properties(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['enterprise'], status='active', billing_mode='manual',
        )
        for i in range(5):
            self.create_property_with_unit(org, name=f'Property {i}')

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post('/api/v1/properties/', self._property_payload('Property 6'))

        self.assertEqual(response.status_code, 201)

    def test_downgrade_overage_blocks_new_create_but_keeps_existing_grandfathered(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['enterprise'], status='active', billing_mode='manual',
        )
        for i in range(3):
            self.create_property_with_unit(org, name=f'Property {i}')
        self.assertEqual(Property.objects.filter(organization=org).count(), 3)

        # Simulate a downgrade to Starter (cap 1) — existing 3 properties are grandfathered (D-06).
        subscription = OrganizationSubscription.objects.get(organization=org)
        subscription.plan = plans['starter']
        subscription.save(update_fields=['plan'])

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post('/api/v1/properties/', self._property_payload('Property 4'))

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Property.objects.filter(organization=org).count(), 3)
