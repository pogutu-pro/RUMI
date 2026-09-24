"""
Billing app tests — plan catalog, subscribe (auto/manual), plan switching,
and feature-gating enforcement (GATE-01).
"""
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import CaretakerProfile
from audit.models import AuditLog
from billing.models import OrganizationSubscription, SubscriptionPayment, SubscriptionPlan
from billing.providers.paystack_billing import PaystackBillingClient
from billing.services.admin_override_service import AdminOverrideService
from billing.services.gating_service import GatingService
from organizations.models import OrganizationMembership
from properties.models import CaretakerPropertyAssignment, Property, RentalUnit
from rumia_api.tests import RumiaTestFixtures

User = get_user_model()


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
        """
        Manual subscribe must never grant paid access on its own — it stays
        'pending' until a super admin confirms the payment actually arrived
        (via AdminSubscriptionOverrideView), the same as any other manual
        payment this platform records. Regression test: this used to set
        status='active' immediately, which meant choosing 'pay another way'
        handed out a live paid plan before anyone had paid anything.
        """
        from datetime import timedelta
        from django.utils import timezone as tz

        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        # Expire the trial so the floor plan (starter) is what get_effective_plan
        # would return with NO subscription at all — the control case this test
        # needs, so subscribing to 'pro' while pending can prove it grants nothing.
        org.created_at = tz.now() - timedelta(days=40)
        org.save(update_fields=['created_at'])

        client = APIClient()
        client.force_authenticate(user=user)
        with patch.object(PaystackBillingClient, 'initialize_subscription_transaction') as mock_init:
            response = client.post('/api/v1/billing/subscribe/', {
                'plan_id': str(plans['pro'].id), 'billing_mode': 'manual',
            })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['status'], 'pending')
        mock_init.assert_not_called()

        subscription = OrganizationSubscription.objects.get(organization=org)
        self.assertEqual(subscription.status, 'pending')
        self.assertEqual(subscription.billing_mode, 'manual')

        from billing.services.gating_service import GatingService
        # Still the starter floor, NOT the 'pro' plan just requested — a
        # pending manual subscription must never grant its plan's access.
        self.assertEqual(GatingService.get_effective_plan(org).id, plans['starter'].id)

    def test_super_admin_confirms_a_manual_subscription_and_it_becomes_active(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        client.post('/api/v1/billing/subscribe/', {
            'plan_id': str(plans['starter'].id), 'billing_mode': 'manual',
        })

        admin_client = APIClient()
        admin_client.force_authenticate(user=admin)
        response = admin_client.post(
            f'/api/v1/billing/admin/organizations/{org.id}/override/',
            {'status': 'active', 'reason': 'Bank transfer confirmed in RumiaRent business account'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)

        subscription = OrganizationSubscription.objects.get(organization=org)
        self.assertEqual(subscription.status, 'active')

        from billing.services.gating_service import GatingService
        self.assertEqual(GatingService.get_effective_plan(org).id, plans['starter'].id)

    @patch.object(PaystackBillingClient, 'initialize_subscription_transaction')
    def test_live_pending_checkout_blocks_a_second_subscribe(self, mock_init):
        plans = self._seed_plans()
        plan = plans['pro']
        plan.paystack_plan_code = 'PLN_pro'
        plan.save(update_fields=['paystack_plan_code'])
        mock_init.return_value = {'authorization_url': 'https://checkout.paystack.com/a', 'access_code': '', 'raw': {}}
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        first = client.post('/api/v1/billing/subscribe/', {'plan_id': str(plan.id), 'billing_mode': 'auto'})
        second = client.post('/api/v1/billing/subscribe/', {'plan_id': str(plan.id), 'billing_mode': 'auto'})

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 400)
        self.assertEqual(SubscriptionPayment.objects.filter(subscription__organization=org).count(), 1)

    @patch.object(PaystackBillingClient, 'initialize_subscription_transaction')
    def test_abandoned_subscribe_checkout_expires_and_can_be_retried(self, mock_init):
        """Audit C2: an abandoned checkout must never lock the organization out."""
        plans = self._seed_plans()
        plan = plans['pro']
        plan.paystack_plan_code = 'PLN_pro'
        plan.save(update_fields=['paystack_plan_code'])
        mock_init.return_value = {'authorization_url': 'https://checkout.paystack.com/a', 'access_code': '', 'raw': {}}
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        client.post('/api/v1/billing/subscribe/', {'plan_id': str(plan.id), 'billing_mode': 'auto'})
        SubscriptionPayment.objects.filter(subscription__organization=org).update(
            initiated_at=timezone.now() - timedelta(hours=1),
        )
        retry = client.post('/api/v1/billing/subscribe/', {'plan_id': str(plan.id), 'billing_mode': 'auto'})

        self.assertEqual(retry.status_code, 201)
        statuses = list(
            SubscriptionPayment.objects.filter(subscription__organization=org)
            .order_by('initiated_at').values_list('status', flat=True)
        )
        self.assertEqual(statuses, ['failed', 'pending'])

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
        admin = self.create_super_admin()

        client = APIClient()
        client.force_authenticate(user=admin)
        first = client.post('/api/v1/billing/subscribe/', {
            'plan_id': str(plans['starter'].id), 'billing_mode': 'manual',
            'organization_id': str(org.id),
        })
        self.assertEqual(first.status_code, 201)

        second = client.post('/api/v1/billing/subscribe/', {
            'plan_id': str(plans['pro'].id), 'billing_mode': 'manual',
            'organization_id': str(org.id),
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

    def test_switch_starts_checkout_without_touching_current_subscription(self):
        """Audit C2: pay first, then switch — nothing changes until the new charge succeeds."""
        plans = self._seed_plans()
        starter, pro = plans['starter'], plans['pro']
        pro.paystack_plan_code = 'PLN_pro'
        pro.save(update_fields=['paystack_plan_code'])
        user, profile, org = self.create_landlord_with_org()
        subscription = self._active_auto_subscription(org, starter)

        with patch.object(PaystackBillingClient, 'disable_subscription') as mock_disable, \
                patch.object(PaystackBillingClient, 'initialize_subscription_transaction') as mock_init:
            mock_init.return_value = {
                'authorization_url': 'https://checkout.paystack.com/switch',
                'access_code': '',
                'raw': {},
            }

            client = APIClient()
            client.force_authenticate(user=user)
            response = client.post('/api/v1/billing/switch-plan/', {'new_plan_id': str(pro.id)})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['authorization_url'], 'https://checkout.paystack.com/switch')
        mock_disable.assert_not_called()
        mock_init.assert_called_once()

        subscription.refresh_from_db()
        self.assertEqual(subscription.plan_id, starter.id)
        self.assertEqual(subscription.status, 'active')
        self.assertEqual(subscription.paystack_subscription_code, 'SUB_code_123')

        payment = SubscriptionPayment.objects.get(subscription=subscription)
        self.assertEqual(payment.amount, pro.price)
        self.assertEqual(payment.metadata['kind'], 'switch')
        self.assertEqual(payment.metadata['plan_id'], str(pro.id))
        self.assertEqual(payment.metadata['replaces_subscription_code'], 'SUB_code_123')

    def test_abandoned_switch_keeps_plan_and_can_be_retried(self):
        """Audit C2: previously both recovery calls returned 400 forever."""
        plans = self._seed_plans()
        starter, pro = plans['starter'], plans['pro']
        pro.paystack_plan_code = 'PLN_pro'
        pro.save(update_fields=['paystack_plan_code'])
        user, profile, org = self.create_landlord_with_org()
        subscription = self._active_auto_subscription(org, starter)

        client = APIClient()
        client.force_authenticate(user=user)
        with patch.object(PaystackBillingClient, 'initialize_subscription_transaction', return_value={
            'authorization_url': 'https://checkout.paystack.com/switch', 'access_code': '', 'raw': {},
        }):
            first = client.post('/api/v1/billing/switch-plan/', {'new_plan_id': str(pro.id)})
            while_live = client.post('/api/v1/billing/switch-plan/', {'new_plan_id': str(pro.id)})
            SubscriptionPayment.objects.filter(subscription=subscription).update(
                initiated_at=timezone.now() - timedelta(hours=1),
            )
            after_expiry = client.post('/api/v1/billing/switch-plan/', {'new_plan_id': str(pro.id)})

        self.assertEqual(first.status_code, 200)
        self.assertEqual(while_live.status_code, 400)
        self.assertEqual(after_expiry.status_code, 200)
        subscription.refresh_from_db()
        self.assertEqual(subscription.plan_id, starter.id)
        self.assertEqual(subscription.status, 'active')
        self.assertEqual(GatingService.get_effective_plan(org).id, starter.id)

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

        admin = self.create_super_admin()
        with patch.object(
            PaystackBillingClient, '__init__',
            side_effect=AssertionError('PaystackBillingClient must never be instantiated for a manual switch'),
        ):
            client = APIClient()
            client.force_authenticate(user=admin)
            response = client.post('/api/v1/billing/switch-plan/', {
                'new_plan_id': str(pro.id), 'organization_id': str(org.id),
            })

        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertEqual(subscription.plan_id, pro.id)

    def test_landlord_cannot_switch_manual_plan_for_free(self):
        """Audit C1: a manual-mode switch has no charge, so it is support-only."""
        plans = self._seed_plans()
        starter, enterprise = plans['starter'], plans['enterprise']
        user, profile, org = self.create_landlord_with_org()
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=starter, status='active', billing_mode='manual',
        )

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post('/api/v1/billing/switch-plan/', {'new_plan_id': str(enterprise.id)})

        self.assertEqual(response.status_code, 403)
        subscription.refresh_from_db()
        self.assertEqual(subscription.plan_id, starter.id)

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


class UnitLimitGateTests(RumiaTestFixtures):
    """D-10 — unit-limit gate wired into RentalUnitListCreateView.post."""

    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def _unit_payload(self, prop, unit_number='C1'):
        return {
            'property': str(prop.id),
            'unit_number': unit_number,
            'unit_type': '1_bedroom',
            'monthly_rent': '20000.00',
            'deposit': '20000.00',
        }

    def test_unit_creation_blocked_at_starter_cap_of_ten(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['starter'], status='active', billing_mode='manual',
        )
        prop, _first_unit = self.create_property_with_unit(org)  # 1 unit already
        for i in range(9):
            RentalUnit.objects.create(
                organization=org, parent_property=prop, unit_number=f'B{i}',
                unit_type='1_bedroom', monthly_rent=Decimal('20000.00'),
                deposit=Decimal('20000.00'), status='vacant',
            )
        self.assertEqual(RentalUnit.objects.filter(organization=org).count(), 10)

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post('/api/v1/units/', self._unit_payload(prop))

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data, {
            'detail': 'Unit limit reached for your plan.',
            'gate': 'max_units',
            'current_tier': 'starter',
            'required_tier': 'pro',
        })

    def test_enterprise_zero_sentinel_means_unlimited_units(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['enterprise'], status='active', billing_mode='manual',
        )
        prop, _first_unit = self.create_property_with_unit(org)

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post('/api/v1/units/', self._unit_payload(prop))

        self.assertEqual(response.status_code, 201)


class CaretakerSeatGateTests(RumiaTestFixtures):
    """D-07/D-10 — caretaker-seat gate wired into CaretakerListCreateView.post."""

    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def _create_caretaker_membership(self, org, email='existing.caretaker@test.com'):
        user = User.objects.create_user(
            email=email, password='TestPass123!', first_name='Care', last_name='Taker',
            role='caretaker', phone_number='+254700000001',
        )
        caretaker_profile = CaretakerProfile.objects.create(
            user=user, created_by=org.owner,
            emergency_contact_name='X', emergency_contact_phone='+254700000002',
        )
        OrganizationMembership.objects.create(organization=org, user=user, role='caretaker')
        return caretaker_profile

    def test_caretaker_creation_blocked_at_starter_cap_of_one(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['starter'], status='active', billing_mode='manual',
        )
        self._create_caretaker_membership(org)  # starter cap is 1 — already at cap

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post('/api/v1/caretakers/', {
            'full_name': 'New Caretaker', 'email': 'new.caretaker@test.com',
            'phone': '+254722333444', 'emergency_contact_name': 'X',
            'emergency_contact_phone': '+254733444555',
        }, format='json')

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data, {
            'detail': 'Caretaker seat limit reached for your plan.',
            'gate': 'max_caretaker_seats',
            'current_tier': 'starter',
            'required_tier': 'pro',
        })

    def test_caretaker_assigned_to_multiple_properties_still_counts_as_one_seat(self):
        # A bespoke 2-seat plan makes the assertion unambiguous: if the gate
        # mistakenly counted CaretakerPropertyAssignment rows (2) instead of
        # distinct caretaker memberships (1), 2 >= 2 would incorrectly block.
        two_seat_plan = SubscriptionPlan.objects.create(
            slug='test-two-seat', name='Test Two Seat', price=Decimal('0.00'),
            max_properties=0, max_units=0, max_caretaker_seats=2,
            features={'analytics': True},
        )
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=two_seat_plan, status='active', billing_mode='manual',
        )
        prop_a, _ = self.create_property_with_unit(org, name='Property A')
        prop_b, _ = self.create_property_with_unit(org, name='Property B')
        caretaker_profile = self._create_caretaker_membership(org)
        CaretakerPropertyAssignment.objects.create(
            caretaker_profile=caretaker_profile, property_assignment=prop_a, organization=org,
        )
        CaretakerPropertyAssignment.objects.create(
            caretaker_profile=caretaker_profile, property_assignment=prop_b, organization=org,
        )

        self.assertEqual(
            OrganizationMembership.objects.filter(
                organization=org, role='caretaker', is_active=True,
            ).count(),
            1,
        )
        self.assertIsNone(GatingService.check_caretaker_seat_limit(org))


class AnalyticsGateTests(RumiaTestFixtures):
    """D-08 — analytics feature gate wired into IncomeSummaryView.get."""

    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def test_starter_tier_blocked_from_income_summary_with_d10_body(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['starter'], status='active', billing_mode='manual',
        )

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get('/api/v1/income/')

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data, {
            'detail': 'Analytics is not included in your plan.',
            'gate': 'analytics',
            'current_tier': 'starter',
            'required_tier': 'pro',
        })

    def test_pro_tier_allowed_income_summary(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['pro'], status='active', billing_mode='manual',
        )

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get('/api/v1/income/')

        self.assertEqual(response.status_code, 200)
        self.assertIn('summary', response.data)

    def test_enterprise_trial_org_allowed_income_summary(self):
        self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        # No OrganizationSubscription row at all — org is within its 30-day
        # no-subscription trial (D-03), so it gets Enterprise-tier access.

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get('/api/v1/income/')

        self.assertEqual(response.status_code, 200)
        self.assertIn('summary', response.data)


class GateRejectionContractTests(RumiaTestFixtures):
    """D-10 — every gate-check rejection body has exactly the canonical key shape."""

    EXPECTED_KEYS = {'detail', 'gate', 'current_tier', 'required_tier'}

    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def test_all_four_gate_dicts_match_d10_key_shape_exactly(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(
            organization=org, plan=plans['starter'], status='active', billing_mode='manual',
        )
        # Starter is already at its property/unit caps by virtue of having
        # zero properties created — max_properties=1, max_units=10, so we
        # first create one property/unit to reach both caps simultaneously.
        prop, _unit = self.create_property_with_unit(org)

        client = APIClient()
        client.force_authenticate(user=user)

        property_response = client.post('/api/v1/properties/', {
            'name': 'Overflow', 'property_type': 'apartment',
            'address': '789 Test Rd', 'city': 'Nairobi',
        })
        self.assertEqual(property_response.status_code, 403)
        self.assertEqual(set(property_response.data.keys()), self.EXPECTED_KEYS)

        for i in range(9):
            RentalUnit.objects.create(
                organization=org, parent_property=prop, unit_number=f'D{i}',
                unit_type='1_bedroom', monthly_rent=Decimal('20000.00'),
                deposit=Decimal('20000.00'), status='vacant',
            )
        unit_response = client.post('/api/v1/units/', {
            'property': str(prop.id), 'unit_number': 'Overflow',
            'unit_type': '1_bedroom', 'monthly_rent': '20000.00', 'deposit': '20000.00',
        })
        self.assertEqual(unit_response.status_code, 403)
        self.assertEqual(set(unit_response.data.keys()), self.EXPECTED_KEYS)

        existing_caretaker_user = User.objects.create_user(
            email='existing-caretaker-for-contract-test@test.com', password='TestPass123!',
            first_name='Existing', last_name='Caretaker', role='caretaker',
            phone_number='+254700000003',
        )
        OrganizationMembership.objects.create(
            organization=org, user=existing_caretaker_user, role='caretaker',
        )
        caretaker_response = client.post('/api/v1/caretakers/', {
            'full_name': 'Overflow Caretaker', 'email': 'overflow@test.com',
            'phone': '+254722333444', 'emergency_contact_name': 'X',
            'emergency_contact_phone': '+254733444555',
        }, format='json')
        self.assertEqual(caretaker_response.status_code, 403)
        self.assertEqual(set(caretaker_response.data.keys()), self.EXPECTED_KEYS)

        income_response = client.get('/api/v1/income/')
        self.assertEqual(income_response.status_code, 403)
        self.assertEqual(set(income_response.data.keys()), self.EXPECTED_KEYS)


class AdminOrganizationBillingDetailViewTests(RumiaTestFixtures):
    """Plan 06-03 Task 1 — super_admin-only joined billing detail."""

    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def test_super_admin_sees_full_detail_including_effective_plan_and_last_charge(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        user, profile, org = self.create_landlord_with_org()
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plans['pro'], status='active',
        )
        payment = SubscriptionPayment.objects.create(
            subscription=subscription, amount=Decimal('2500.00'),
            internal_reference='SUB-DETAILTEST1', status='success',
        )

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get(f'/api/v1/billing/admin/organizations/{org.id}/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['last_charge_event']['id'], str(payment.id))
        self.assertNotIn('paystack_subscription_code', response.data['subscription'])

    def test_landlord_gets_403(self):
        self._seed_plans()
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get(f'/api/v1/billing/admin/organizations/{org.id}/')

        self.assertEqual(response.status_code, 403)

    def test_last_charge_tiebreak_uses_id_when_initiated_at_matches(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        user, profile, org = self.create_landlord_with_org()
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plans['pro'], status='active',
        )
        same_instant = timezone.now()
        payment_a = SubscriptionPayment.objects.create(
            subscription=subscription, amount=Decimal('2500.00'),
            internal_reference='SUB-TIEBREAK1', status='success',
            initiated_at=same_instant,
        )
        payment_b = SubscriptionPayment.objects.create(
            subscription=subscription, amount=Decimal('2500.00'),
            internal_reference='SUB-TIEBREAK2', status='success',
            initiated_at=same_instant,
        )
        # UUID primary keys are random (UUID4), not creation-ordered, so the
        # `-id` secondary sort picks whichever row has the lexicographically
        # greater id — compute that directly rather than assuming insertion
        # order, which is what this test must prove is NOT what determines
        # the result.
        expected_id = max(payment_a.id, payment_b.id)

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get(f'/api/v1/billing/admin/organizations/{org.id}/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['last_charge_event']['id'], str(expected_id))


class AdminOrganizationBillingListViewTests(RumiaTestFixtures):
    """Plan 06-03 Task 2 — super_admin-only searchable organization list."""

    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def test_list_includes_plan_status_payout_inline(self):
        from organizations.models import PayoutAccount

        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org_a = self.create_landlord_with_org(email='landlord-a@test.com')
        OrganizationSubscription.objects.create(organization=org_a, plan=plans['pro'], status='active')
        PayoutAccount.objects.create(organization=org_a, status='active')
        _, _, org_b = self.create_landlord_with_org(email='landlord-b@test.com')
        org_b.name = 'Zzz No Subscription Org'
        org_b.save(update_fields=['name'])

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get('/api/v1/billing/admin/organizations/')

        self.assertEqual(response.status_code, 200)
        rows_by_id = {row['id']: row for row in response.data['results']}
        self.assertEqual(rows_by_id[str(org_a.id)]['plan_slug'], 'pro')
        self.assertEqual(rows_by_id[str(org_a.id)]['subscription_status'], 'active')
        self.assertEqual(rows_by_id[str(org_a.id)]['payout_status'], 'active')
        self.assertEqual(rows_by_id[str(org_b.id)]['plan_slug'], None)
        self.assertEqual(rows_by_id[str(org_b.id)]['payout_status'], 'not_started')

    def test_search_filters_by_name_icontains(self):
        self._seed_plans()
        admin = self.create_super_admin()
        _, _, org_a = self.create_landlord_with_org(email='landlord-a@test.com')
        org_a.name = 'Greenview Holdings'
        org_a.save(update_fields=['name'])
        _, _, org_b = self.create_landlord_with_org(email='landlord-b@test.com')
        org_b.name = 'Riverside Estates'
        org_b.save(update_fields=['name'])

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get('/api/v1/billing/admin/organizations/', {'search': 'green'})

        self.assertEqual(response.status_code, 200)
        names = {row['name'] for row in response.data['results']}
        self.assertEqual(names, {'Greenview Holdings'})

    def test_ordering_is_deterministic_by_name_then_id(self):
        self._seed_plans()
        admin = self.create_super_admin()
        _, _, org_a = self.create_landlord_with_org(email='landlord-a@test.com')
        org_a.name = 'Identical Name Org'
        org_a.save(update_fields=['name'])
        _, _, org_b = self.create_landlord_with_org(email='landlord-b@test.com')
        org_b.name = 'Identical Name Org'
        org_b.save(update_fields=['name'])
        expected_order = sorted([org_a.id, org_b.id])

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get('/api/v1/billing/admin/organizations/', {'search': 'Identical Name Org'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [row['id'] for row in response.data['results']],
            [str(i) for i in expected_order],
        )

    def test_landlord_gets_403(self):
        self._seed_plans()
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get('/api/v1/billing/admin/organizations/')

        self.assertEqual(response.status_code, 403)

    def test_list_is_paginated(self):
        self._seed_plans()
        admin = self.create_super_admin()
        self.create_landlord_with_org(email='landlord-a@test.com')

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get('/api/v1/billing/admin/organizations/')

        self.assertEqual(response.status_code, 200)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)
        self.assertIsInstance(response.data['results'], list)


class AdminRevenueSummaryViewTests(RumiaTestFixtures):
    """Real numbers from SubscriptionPayment/OrganizationSubscription —
    distinct from AdminOrganizationBillingListView, which shows each org's
    own status, not what the platform has actually earned in total."""

    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def test_landlord_gets_403(self):
        self._seed_plans()
        user, profile, org = self.create_landlord_with_org()

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get('/api/v1/billing/admin/revenue/')

        self.assertEqual(response.status_code, 403)

    def test_only_successful_payments_count_toward_revenue(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plans['pro'], status='active',
        )
        SubscriptionPayment.objects.create(
            subscription=subscription, amount=Decimal('7999.00'),
            internal_reference='SUB-1', status='success', paid_at=timezone.now(),
        )
        SubscriptionPayment.objects.create(
            subscription=subscription, amount=Decimal('7999.00'),
            internal_reference='SUB-2', status='failed',
        )
        SubscriptionPayment.objects.create(
            subscription=subscription, amount=Decimal('7999.00'),
            internal_reference='SUB-3', status='pending',
        )

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get('/api/v1/billing/admin/revenue/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(response.data['total_revenue']), Decimal('7999.00'))
        self.assertEqual(response.data['total_successful_payments'], 1)

    def test_mrr_sums_active_subscriptions_plan_price_only(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org_active = self.create_landlord_with_org(email='active@test.com')
        OrganizationSubscription.objects.create(
            organization=org_active, plan=plans['pro'], status='active',
        )
        _, _, org_cancelled = self.create_landlord_with_org(email='cancelled@test.com')
        OrganizationSubscription.objects.create(
            organization=org_cancelled, plan=plans['enterprise'], status='cancelled',
        )

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get('/api/v1/billing/admin/revenue/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(response.data['mrr']), plans['pro'].price)
        self.assertEqual(response.data['active_subscriptions_count'], 1)

    def test_revenue_this_month_excludes_prior_months(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plans['starter'], status='active',
        )
        SubscriptionPayment.objects.create(
            subscription=subscription, amount=Decimal('2999.00'),
            internal_reference='SUB-THIS-MONTH', status='success', paid_at=timezone.now(),
        )
        SubscriptionPayment.objects.create(
            subscription=subscription, amount=Decimal('2999.00'),
            internal_reference='SUB-LAST-MONTH', status='success',
            paid_at=timezone.now() - timedelta(days=45),
        )

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get('/api/v1/billing/admin/revenue/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(response.data['revenue_this_month']), Decimal('2999.00'))
        self.assertEqual(Decimal(response.data['total_revenue']), Decimal('5998.00'))

    def test_no_payments_returns_zero_not_error(self):
        self._seed_plans()
        admin = self.create_super_admin()

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get('/api/v1/billing/admin/revenue/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(response.data['total_revenue']), Decimal('0'))
        self.assertEqual(response.data['monthly_revenue'], [])


class AdminOverrideServiceTests(RumiaTestFixtures):
    """
    Plan 06-03 Task 3 (RED) — AdminOverrideService.override_subscription()
    behavior spec, tested at the service layer independent of the view.
    """

    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def test_status_only_override_leaves_plan_unchanged_and_logs_audit(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plans['starter'], status='active',
        )

        result = AdminOverrideService.override_subscription(
            org, status='suspended', reason='Manual bank transfer reconciliation', actor=admin,
        )

        subscription.refresh_from_db()
        self.assertEqual(subscription.plan_id, plans['starter'].id)
        self.assertEqual(subscription.status, 'suspended')
        self.assertEqual(result.id, subscription.id)

        audit_entries = AuditLog.objects.filter(organization=org)
        self.assertEqual(audit_entries.count(), 1)
        entry = audit_entries.first()
        self.assertEqual(entry.old_value, {'plan': 'starter', 'status': 'active'})
        self.assertEqual(entry.new_value, {'plan': 'starter', 'status': 'suspended'})
        self.assertEqual(entry.metadata['reason'], 'Manual bank transfer reconciliation')

    def test_blank_reason_raises_before_any_db_write(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(organization=org, plan=plans['starter'], status='active')

        before = AuditLog.objects.count()
        with self.assertRaises(ValueError):
            AdminOverrideService.override_subscription(org, status='suspended', reason='   ', actor=admin)
        self.assertEqual(AuditLog.objects.count(), before)

    def test_both_omitted_raises_before_any_db_write(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(organization=org, plan=plans['starter'], status='active')

        before = AuditLog.objects.count()
        with self.assertRaises(ValueError):
            AdminOverrideService.override_subscription(org, reason='reconciling', actor=admin)
        self.assertEqual(AuditLog.objects.count(), before)

    def test_value_identical_override_still_succeeds_and_logs_audit(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(organization=org, plan=plans['starter'], status='active')

        result = AdminOverrideService.override_subscription(
            org, plan=plans['starter'], status='active', reason='Re-stamping record', actor=admin,
        )

        self.assertEqual(result.status, 'active')
        entry = AuditLog.objects.filter(organization=org).first()
        self.assertIsNotNone(entry)
        self.assertEqual(entry.old_value, entry.new_value)

    def test_status_only_override_with_no_existing_subscription_raises_cleanly(self):
        """
        Regression guard (code review CR-01): a status-only override (no
        plan) for an organization with no OrganizationSubscription row —
        the normal state for an org still inside its 30-day no-subscription
        trial — must raise ValueError, not an unhandled IntegrityError from
        get_or_create's defaults omitting the non-nullable plan FK.
        """
        self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        self.assertFalse(OrganizationSubscription.objects.filter(organization=org).exists())

        before = AuditLog.objects.count()
        with self.assertRaises(ValueError):
            AdminOverrideService.override_subscription(org, status='suspended', reason='Trial abuse', actor=admin)
        self.assertFalse(OrganizationSubscription.objects.filter(organization=org).exists())
        self.assertEqual(AuditLog.objects.count(), before)


class AdminSubscriptionOverrideViewTests(RumiaTestFixtures):
    """Plan 06-03 Task 3 — POST /billing/admin/organizations/{id}/override/."""

    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def _url(self, org_id):
        return f'/api/v1/billing/admin/organizations/{org_id}/override/'

    def test_successful_status_only_override_creates_audit_log(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(organization=org, plan=plans['starter'], status='active')

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.post(self._url(org.id), {'status': 'suspended', 'reason': 'Support ticket #42'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['subscription']['status'], 'suspended')
        self.assertEqual(AuditLog.objects.filter(organization=org).count(), 1)

    def test_successful_plan_only_override(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(organization=org, plan=plans['starter'], status='active')

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.post(
            self._url(org.id), {'plan_id': str(plans['pro'].id), 'reason': 'Comping customer'},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['subscription']['plan'], plans['pro'].id)

    def test_blank_reason_400(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(organization=org, plan=plans['starter'], status='active')

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.post(self._url(org.id), {'status': 'suspended', 'reason': ''})

        self.assertEqual(response.status_code, 400)

    def test_both_omitted_400(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(organization=org, plan=plans['starter'], status='active')

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.post(self._url(org.id), {'reason': 'no fields given'})

        self.assertEqual(response.status_code, 400)

    def test_status_only_override_with_no_existing_subscription_returns_400(self):
        """
        Regression guard (code review CR-01): previously an unhandled
        IntegrityError (500) — must now be a clean 400, not a crash, since
        this is directly reachable from the shipped override dialog (Plan
        left at "No change") for any org still inside its no-subscription
        trial period.
        """
        self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        self.assertFalse(OrganizationSubscription.objects.filter(organization=org).exists())

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.post(self._url(org.id), {'status': 'suspended', 'reason': 'Trial abuse'})

        self.assertEqual(response.status_code, 400)
        self.assertFalse(OrganizationSubscription.objects.filter(organization=org).exists())

    def test_landlord_gets_403(self):
        plans = self._seed_plans()
        user, profile, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(organization=org, plan=plans['starter'], status='active')

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post(self._url(org.id), {'status': 'suspended', 'reason': 'x'})

        self.assertEqual(response.status_code, 403)

    def test_invalid_plan_id_400(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(organization=org, plan=plans['starter'], status='active')

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.post(
            self._url(org.id), {'plan_id': '00000000-0000-0000-0000-000000000000', 'reason': 'x'},
        )

        self.assertEqual(response.status_code, 400)

    def test_invalid_status_400(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        OrganizationSubscription.objects.create(organization=org, plan=plans['starter'], status='active')

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.post(self._url(org.id), {'status': 'not-a-real-status', 'reason': 'x'})

        self.assertEqual(response.status_code, 400)

    def test_override_ignores_paystack_and_billing_mode_fields_in_payload(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plans['starter'], status='active',
            paystack_subscription_code='sub_original', billing_mode='auto',
        )

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.post(self._url(org.id), {
            'status': 'suspended', 'reason': 'x',
            'paystack_subscription_code': 'sub_HACKED', 'billing_mode': 'manual',
        })

        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertEqual(subscription.paystack_subscription_code, 'sub_original')
        self.assertEqual(subscription.billing_mode, 'auto')


class AdminPlatformOverviewViewTests(RumiaTestFixtures):
    """One-call platform snapshot for the super-admin Overview page —
    users by role, organizations, revenue, and open support tickets."""

    def _seed_plans(self):
        call_command('seed_subscription_plans')
        return {p.slug: p for p in SubscriptionPlan.objects.all()}

    def test_landlord_gets_403(self):
        user, profile, org = self.create_landlord_with_org()
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get('/api/v1/billing/admin/overview/')
        self.assertEqual(response.status_code, 403)

    def test_anonymous_gets_401(self):
        client = APIClient()
        response = client.get('/api/v1/billing/admin/overview/')
        self.assertEqual(response.status_code, 401)

    def test_counts_users_by_role(self):
        admin = self.create_super_admin()
        self.create_landlord_with_org(email='l1@test.com')
        _, _, org2 = self.create_landlord_with_org(email='l2@test.com')
        self.create_tenant(org2, email='t1@test.com')
        self.create_tenant(org2, email='t2@test.com')

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get('/api/v1/billing/admin/overview/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['users_by_role'].get('landlord'), 2)
        self.assertEqual(response.data['users_by_role'].get('tenant'), 2)
        self.assertEqual(response.data['users_by_role'].get('super_admin'), 1)
        self.assertEqual(response.data['total_users'], 5)

    def test_counts_organizations(self):
        admin = self.create_super_admin()
        self.create_landlord_with_org(email='l1@test.com')
        self.create_landlord_with_org(email='l2@test.com')

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get('/api/v1/billing/admin/overview/')

        self.assertEqual(response.data['total_organizations'], 2)

    def test_revenue_matches_admin_revenue_summary(self):
        plans = self._seed_plans()
        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        subscription = OrganizationSubscription.objects.create(
            organization=org, plan=plans['pro'], status='active',
        )
        SubscriptionPayment.objects.create(
            subscription=subscription, amount=Decimal('7999.00'),
            internal_reference='SUB-OVERVIEW-1', status='success', paid_at=timezone.now(),
        )

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get('/api/v1/billing/admin/overview/')

        self.assertEqual(Decimal(response.data['total_revenue']), Decimal('7999.00'))
        self.assertEqual(Decimal(response.data['mrr']), plans['pro'].price)
        self.assertEqual(response.data['paying_organizations'], 1)

    def test_counts_open_and_in_progress_tickets_as_open(self):
        from support.models import SupportTicket

        admin = self.create_super_admin()
        _, _, org = self.create_landlord_with_org()
        SupportTicket.objects.create(
            organization=org, created_by=admin, subject='A', description='x', status='open',
        )
        SupportTicket.objects.create(
            organization=org, created_by=admin, subject='B', description='x', status='in_progress',
        )
        SupportTicket.objects.create(
            organization=org, created_by=admin, subject='C', description='x', status='resolved',
        )
        SupportTicket.objects.create(
            organization=org, created_by=admin, subject='D', description='x', status='closed',
        )

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get('/api/v1/billing/admin/overview/')

        self.assertEqual(response.data['open_support_tickets'], 2)
        self.assertEqual(response.data['total_support_tickets'], 4)


class TrialAccessSummaryTests(RumiaTestFixtures):
    """A new landlord gets Enterprise free for the trial window, and can see it."""

    def setUp(self):
        call_command('seed_subscription_plans')
        self.landlord, _, self.org = self.create_landlord_with_org()

    def _backdate(self, days):
        self.org.created_at = timezone.now() - timedelta(days=days)
        self.org.save(update_fields=['created_at'])
        self.org.refresh_from_db()

    def _get(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client.get('/api/v1/billing/access/')

    def test_brand_new_landlord_is_on_an_enterprise_trial_for_the_full_window(self):
        summary = GatingService.get_access_summary(self.org)
        self.assertEqual(summary['effective_plan'], 'enterprise')
        self.assertTrue(summary['on_trial'])
        self.assertFalse(summary['trial_expired'])
        self.assertEqual(summary['trial_days_left'], 30)

    def test_days_left_counts_down(self):
        self._backdate(20)
        self.assertEqual(GatingService.get_access_summary(self.org)['trial_days_left'], 10)

    def test_after_the_window_they_fall_to_starter_and_are_told_so(self):
        self._backdate(31)
        summary = GatingService.get_access_summary(self.org)
        self.assertEqual(summary['effective_plan'], 'starter')
        self.assertFalse(summary['on_trial'])
        self.assertTrue(summary['trial_expired'])
        self.assertEqual(summary['trial_days_left'], 0)

    def test_a_paying_landlord_is_not_shown_as_on_trial(self):
        plans = {p.slug: p for p in SubscriptionPlan.objects.all()}
        OrganizationSubscription.objects.create(
            organization=self.org, plan=plans['pro'], status='active', billing_mode='manual',
        )
        from organizations.models import Organization
        summary = GatingService.get_access_summary(Organization.objects.get(pk=self.org.pk))
        self.assertEqual(summary['effective_plan'], 'pro')
        self.assertFalse(summary['on_trial'])
        self.assertFalse(summary['trial_expired'])

    def test_trial_length_follows_the_setting(self):
        from django.test import override_settings
        self._backdate(10)
        with override_settings(SUBSCRIPTION_TRIAL_DAYS=14):
            self.assertEqual(GatingService.get_access_summary(self.org)['trial_days_left'], 4)

    def test_endpoint_returns_the_landlords_own_summary(self):
        resp = self._get(self.landlord)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data['on_trial'])
        self.assertEqual(resp.data['effective_plan'], 'enterprise')

    def test_endpoint_is_not_for_tenants(self):
        _, tenant = self.create_tenant(self.org)
        self.assertEqual(self._get(tenant.user).status_code, 403)


class AdminPlanEditingTests(RumiaTestFixtures):
    """A super admin edits tier prices/limits; the public catalog follows at once."""

    def setUp(self):
        call_command('seed_subscription_plans')
        self.admin = self.create_super_admin()
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.pro = SubscriptionPlan.objects.get(slug='pro')

    def _client(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def _patch(self, user, plan, payload):
        return self._client(user).patch(f'/api/v1/billing/admin/plans/{plan.id}/', payload, format='json')

    def test_admin_lists_all_tiers_with_subscriber_counts(self):
        OrganizationSubscription.objects.create(
            organization=self.org, plan=self.pro, status='active', billing_mode='manual',
        )
        resp = self._client(self.admin).get('/api/v1/billing/admin/plans/')
        self.assertEqual(resp.status_code, 200)
        by_slug = {p['slug']: p for p in resp.json()}
        self.assertEqual(set(by_slug), {'starter', 'pro', 'enterprise'})
        self.assertEqual(by_slug['pro']['active_subscribers'], 1)
        self.assertNotIn('paystack_plan_code', by_slug['pro'])

    def test_only_super_admin_may_view_or_edit(self):
        for user in (self.landlord,):
            self.assertEqual(self._client(user).get('/api/v1/billing/admin/plans/').status_code, 403)
            self.assertEqual(self._patch(user, self.pro, {'price': '1'}).status_code, 403)
        self.assertIn(APIClient().get('/api/v1/billing/admin/plans/').status_code, (401, 403))

    def test_price_change_shows_on_the_public_catalog_immediately(self):
        resp = self._patch(self.admin, self.pro, {'price': '8499.00', 'max_units': 60})
        self.assertEqual(resp.status_code, 200)
        self.pro.refresh_from_db()
        self.assertEqual(self.pro.price, Decimal('8499.00'))
        public = {p['slug']: p for p in APIClient().get('/api/v1/billing/plans/').json()}
        self.assertEqual(Decimal(public['pro']['price']), Decimal('8499.00'))
        self.assertEqual(public['pro']['max_units'], 60)

    def test_saving_clears_the_cached_public_plan_list(self):
        from unittest import mock
        with mock.patch('rumi.cache_utils.api_cache.cache_manager.delete') as delete:
            self._patch(self.admin, self.pro, {'price': '8000'})
        delete.assert_called()

    def test_validation_rejects_bad_input_and_changes_nothing(self):
        for payload in ({'price': '0'}, {'price': '-5'}, {'price': '99999999'}, {'name': '  '},
                        {'max_units': -1}, {'features': {'made_up': True}}, {'features': {'analytics': 'yes'}}):
            with self.subTest(payload=payload):
                self.assertEqual(self._patch(self.admin, self.pro, payload).status_code, 400)
        self.pro.refresh_from_db()
        self.assertEqual(self.pro.price, Decimal('7999.00'))

    def test_feature_switches_merge_rather_than_replace(self):
        self._patch(self.admin, self.pro, {'features': {'analytics': False}})
        self.pro.refresh_from_db()
        self.assertEqual(self.pro.features, {'analytics': False})
        self._patch(self.admin, self.pro, {'features': {'analytics': True}})
        self.pro.refresh_from_db()
        self.assertEqual(self.pro.features, {'analytics': True})

    def test_the_slug_cannot_be_changed(self):
        self._patch(self.admin, self.pro, {'slug': 'hacked', 'interval': 'yearly'})
        self.pro.refresh_from_db()
        self.assertEqual((self.pro.slug, self.pro.interval), ('pro', 'monthly'))

    def test_edit_is_audit_logged_with_before_and_after(self):
        from audit.models import AuditLog
        self._patch(self.admin, self.pro, {'price': '8000'})
        entry = AuditLog.objects.filter(action='subscription_plan_updated').latest('id')
        self.assertEqual(entry.actor, self.admin)
        self.assertIn('7999', str(entry.old_value))
        self.assertIn('8000', str(entry.new_value))

    def test_paystack_is_updated_when_the_plan_is_linked(self):
        from unittest import mock
        self.pro.paystack_plan_code = 'PLN_test'
        self.pro.save()
        with mock.patch('billing.views.PaystackBillingClient.update_plan') as update:
            resp = self._patch(self.admin, self.pro, {'price': '8000'})
        update.assert_called_once_with('PLN_test', 'Pro', Decimal('8000.00'))
        self.assertEqual(resp.json()['paystack_sync']['status'], 'updated')

    def test_a_paystack_failure_still_saves_and_says_so(self):
        from unittest import mock
        from rent.providers.base import PaymentProviderError
        self.pro.paystack_plan_code = 'PLN_test'
        self.pro.save()
        with mock.patch(
            'billing.views.PaystackBillingClient.update_plan',
            side_effect=PaymentProviderError('boom', 'paystack', recoverable=True),
        ):
            resp = self._patch(self.admin, self.pro, {'price': '8000'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['paystack_sync']['status'], 'failed')
        self.pro.refresh_from_db()
        self.assertEqual(self.pro.price, Decimal('8000.00'))

    def test_unlinked_plan_is_saved_and_reported_as_skipped(self):
        self.pro.paystack_plan_code = ''
        self.pro.save()
        resp = self._patch(self.admin, self.pro, {'price': '8000'})
        self.assertEqual(resp.json()['paystack_sync']['status'], 'skipped')

    def test_changing_only_limits_does_not_touch_paystack(self):
        from unittest import mock
        self.pro.paystack_plan_code = 'PLN_test'
        self.pro.save()
        with mock.patch('billing.views.PaystackBillingClient.update_plan') as update:
            resp = self._patch(self.admin, self.pro, {'max_units': 75})
        update.assert_not_called()
        self.assertEqual(resp.json()['paystack_sync']['status'], 'not_needed')

    def test_new_price_applies_to_later_trials_and_gating_reads_the_new_limits(self):
        self._patch(self.admin, self.pro, {'max_properties': 9})
        OrganizationSubscription.objects.create(
            organization=self.org, plan=SubscriptionPlan.objects.get(slug='pro'),
            status='active', billing_mode='manual',
        )
        from organizations.models import Organization
        fresh = Organization.objects.get(pk=self.org.pk)
        self.assertEqual(GatingService.get_effective_plan(fresh).max_properties, 9)

    def test_no_plan_advertises_a_feature_that_does_not_exist(self):
        """Branded receipts were never built; the public catalog must not list them."""
        public = APIClient().get('/api/v1/billing/plans/').json()
        for plan in public:
            self.assertEqual(set(plan['features']), {'analytics'})
        self.assertEqual(self._patch(self.admin, self.pro, {'features': {'branded_receipts': True}}).status_code, 400)

    def test_the_migration_strips_the_flag_from_existing_plans(self):
        import importlib
        from django.apps import apps
        migration = importlib.import_module('billing.migrations.0002_remove_branded_receipts_feature')
        SubscriptionPlan.objects.filter(slug='pro').update(features={'analytics': True, 'branded_receipts': True})
        migration.drop_branded_receipts(apps, None)
        self.assertEqual(SubscriptionPlan.objects.get(slug='pro').features, {'analytics': True})



class ManualPaymentInstructionsViewTests(RumiaTestFixtures):
    """
    A landlord who cannot pay by card needs to see what to do instead —
    and it must be whatever a super admin actually typed in, never
    anything invented in code (a fabricated account number here would be a
    real, live way to lose someone's money).
    """

    url = '/api/v1/billing/manual-payment-instructions/'

    def test_defaults_to_blank_until_a_super_admin_sets_it(self):
        user, _, _org = self.create_landlord_with_org()
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['instructions'], '')

    def test_landlord_cannot_edit_it(self):
        user, _, _org = self.create_landlord_with_org()
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.put(self.url, {'instructions': 'Paybill 000000'}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_super_admin_sets_it_and_a_landlord_then_sees_it(self):
        admin = self.create_super_admin()
        user, _, _org = self.create_landlord_with_org()

        admin_client = APIClient()
        admin_client.force_authenticate(user=admin)
        text = 'Bank: Example Bank\nAccount name: Stratnovo Ltd\nAccount number: 0123456789'
        response = admin_client.put(self.url, {'instructions': text}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['instructions'], text)

        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get(self.url)
        self.assertEqual(response.data['instructions'], text)

    def test_tenant_cannot_read_it(self):
        _, tenant = self.create_tenant(self.create_landlord_with_org()[2])
        client = APIClient()
        client.force_authenticate(user=tenant.user)
        response = client.get(self.url)
        self.assertEqual(response.status_code, 403)

    def test_editing_it_is_audit_logged(self):
        admin = self.create_super_admin()
        client = APIClient()
        client.force_authenticate(user=admin)
        client.put(self.url, {'instructions': 'Till 000000'}, format='json')
        self.assertTrue(
            AuditLog.objects.filter(action='manual_payment_instructions_updated', actor=admin).exists()
        )
