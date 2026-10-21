"""Launch-price migration and the Paystack plan sync that runs on deploy."""
from __future__ import annotations

import importlib
from decimal import Decimal
from io import StringIO
from unittest.mock import patch

from django.apps import apps as django_apps
from django.core.management import call_command
from django.test import TestCase, override_settings

from billing.models import SubscriptionPlan
from rent.providers.base import PaymentProviderError

launch_prices = importlib.import_module('billing.migrations.0004_launch_prices')
CLIENT = 'billing.management.commands.sync_paystack_plans.PaystackBillingClient'


def _plan(slug, price, code='', **kw):
    return SubscriptionPlan.objects.create(
        name=slug.title(), slug=slug, price=Decimal(price), paystack_plan_code=code, **kw,
    )


class LaunchPriceMigrationTests(TestCase):
    def test_seed_prices_move_to_launch_prices(self):
        _plan('starter', '2999.00', max_properties=1, max_units=10)
        _plan('pro', '7999.00', max_properties=5, max_units=50)
        _plan('enterprise', '19999.00')

        launch_prices.apply(django_apps, None)

        got = {p.slug: (p.price, p.max_properties, p.max_units) for p in SubscriptionPlan.objects.all()}
        self.assertEqual(got['starter'], (Decimal('1499.00'), 2, 20))
        self.assertEqual(got['pro'], (Decimal('3999.00'), 10, 60))
        self.assertEqual(got['enterprise'], (Decimal('9999.00'), 0, 0))

    def test_a_hand_set_price_is_left_alone(self):
        _plan('starter', '2500.00', max_properties=3, max_units=15)

        launch_prices.apply(django_apps, None)

        plan = SubscriptionPlan.objects.get(slug='starter')
        self.assertEqual((plan.price, plan.max_units), (Decimal('2500.00'), 15))

    def test_revert_restores_seed_prices(self):
        _plan('starter', '2999.00', max_properties=1, max_units=10)
        launch_prices.apply(django_apps, None)
        launch_prices.revert(django_apps, None)

        plan = SubscriptionPlan.objects.get(slug='starter')
        self.assertEqual((plan.price, plan.max_properties, plan.max_units), (Decimal('2999.00'), 1, 10))


@override_settings(PAYSTACK_SECRET_KEY='sk_test_x')
class SyncPaystackPlansTests(TestCase):
    def run_sync(self):
        out = StringIO()
        call_command('sync_paystack_plans', stdout=out)
        return out.getvalue()

    @override_settings(PAYSTACK_SECRET_KEY='')
    def test_does_nothing_without_paystack(self):
        _plan('starter', '1499.00', 'PLN_a')
        with patch(CLIENT) as client:
            self.assertIn('not configured', self.run_sync())
        client.assert_not_called()

    def test_price_cut_moves_existing_subscribers(self):
        _plan('starter', '1499.00', 'PLN_a')
        with patch(CLIENT) as client:
            client.return_value.get_plan.return_value = {'amount': 299900, 'name': 'Starter'}
            self.run_sync()
        client.return_value.update_plan.assert_called_once_with(
            'PLN_a', 'Starter', Decimal('1499.00'), update_existing=True,
        )

    def test_price_rise_only_affects_new_subscribers(self):
        _plan('starter', '1999.00', 'PLN_a')
        with patch(CLIENT) as client:
            client.return_value.get_plan.return_value = {'amount': 149900, 'name': 'Starter'}
            self.run_sync()
        client.return_value.update_plan.assert_called_once_with(
            'PLN_a', 'Starter', Decimal('1999.00'), update_existing=False,
        )

    def test_matching_plan_is_not_touched(self):
        _plan('starter', '1499.00', 'PLN_a')
        with patch(CLIENT) as client:
            client.return_value.get_plan.return_value = {'amount': 149900, 'name': 'Starter'}
            self.assertIn('in sync', self.run_sync())
        client.return_value.update_plan.assert_not_called()

    def test_unlinked_plan_gets_a_paystack_plan(self):
        _plan('starter', '1499.00')
        with patch(CLIENT) as client:
            client.return_value.create_plan.return_value = {'plan_code': 'PLN_new'}
            self.run_sync()
        self.assertEqual(SubscriptionPlan.objects.get(slug='starter').paystack_plan_code, 'PLN_new')

    def test_one_failure_does_not_stop_the_rest(self):
        _plan('starter', '1499.00', 'PLN_a', sort_order=1)
        _plan('pro', '3999.00', 'PLN_b', sort_order=2)
        with patch(CLIENT) as client:
            client.return_value.get_plan.side_effect = [
                PaymentProviderError('down', 'paystack'),
                {'amount': 799900, 'name': 'Pro'},
            ]
            out = self.run_sync()
        self.assertIn('starter: not synced', out)
        client.return_value.update_plan.assert_called_once()
