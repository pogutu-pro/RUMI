"""Phase 1g — late penalties: policy resolution, amounts, caps, frequency, waiver, API."""

from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from rest_framework.test import APIClient

from ledger.services import chart
from ledger.services.posting import LedgerService
from ledger.tests import assert_ledger_balanced
from rent.models import Invoice, PenaltyPolicy
from rent.services.invoicing import InvoiceService, LineSpec
from rent.services.penalties import PenaltyService
from rumia_api.tests import RumiaTestFixtures

D = Decimal
DUE = date(2026, 5, 5)
SMS = 'rent.services.notifications.send_sms_via_africastalking'


class PenaltyFixtures(RumiaTestFixtures):
    def setUp(self):
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)  # grace_period_days=5
        self.rent = InvoiceService.create_invoice(
            self.tenancy, 'rent', [LineSpec('rent', D('20000'))],
            period_start=date(2026, 5, 1), period_end=date(2026, 5, 31), due_date=DUE, as_of=date(2026, 5, 1),
        )

    def policy(self, **kwargs):
        defaults = {'organization': self.org, 'enabled': True, 'method': 'fixed', 'amount': D('1000')}
        defaults.update(kwargs)
        return PenaltyPolicy.objects.create(**defaults)

    def run_on(self, day):
        with patch(SMS):
            return PenaltyService.run(as_of=day)['issued']

    def penalties(self):
        return list(Invoice.objects.filter(invoice_type='penalty', source_invoice=self.rent).order_by('period_start'))


class PenaltyRuleTests(PenaltyFixtures):
    def test_disabled_by_default(self):
        self.assertEqual(self.run_on(DUE + timedelta(days=30)), 0)
        PenaltyPolicy.objects.create(organization=self.org)  # exists but enabled=False
        self.assertEqual(self.run_on(DUE + timedelta(days=30)), 0)

    def test_respects_tenancy_grace_period_then_charges_once(self):
        self.policy()
        self.assertEqual(self.run_on(DUE + timedelta(days=5)), 0)  # still within 5-day grace
        self.assertEqual(self.run_on(DUE + timedelta(days=6)), 1)
        self.assertEqual(self.run_on(DUE + timedelta(days=7)), 0)  # 'once'
        self.assertEqual(self.run_on(DUE + timedelta(days=60)), 0)

        penalty = self.penalties()[0]
        self.assertEqual(penalty.amount_due, D('1000.00'))
        self.assertEqual(penalty.lines.get().description, f'Late penalty on {self.rent.number}')
        self.assertEqual(LedgerService.balance(self.org, chart.PENALTY_INCOME), D('1000.00'))
        assert_ledger_balanced(self)

    def test_policy_grace_days_override_tenancy(self):
        self.policy(grace_days=0)
        self.assertEqual(self.run_on(DUE + timedelta(days=1)), 1)

    def test_percent_of_outstanding_with_monthly_repeat_and_cap(self):
        self.policy(method='percent', percent=D('10'), frequency='monthly', cap_percent_of_invoice=D('25'))
        first_day = DUE + timedelta(days=6)
        self.assertEqual(self.run_on(first_day), 1)                         # 10% of 20000 = 2000
        self.assertEqual(self.run_on(first_day + timedelta(days=15)), 0)    # same month
        self.assertEqual(self.run_on(first_day + timedelta(days=31)), 1)    # 2000 again
        self.assertEqual(self.run_on(first_day + timedelta(days=62)), 1)    # capped: 5000 − 4000 = 1000
        self.assertEqual(self.run_on(first_day + timedelta(days=93)), 0)    # cap reached
        self.assertEqual([p.amount_due for p in self.penalties()], [D('2000.00'), D('2000.00'), D('1000.00')])

    def test_property_override_beats_organization_policy(self):
        self.policy(amount=D('1000'))
        self.policy(parent_property=self.prop, amount=D('250'))
        self.run_on(DUE + timedelta(days=6))
        self.assertEqual(self.penalties()[0].amount_due, D('250.00'))

    def test_property_override_can_switch_penalties_off(self):
        self.policy()
        self.policy(parent_property=self.prop, enabled=False)
        self.assertEqual(self.run_on(DUE + timedelta(days=30)), 0)

    def test_paid_disputed_and_penalty_invoices_are_not_penalized(self):
        self.policy(frequency='monthly')
        InvoiceService.set_disputed(self.rent, True)
        self.assertEqual(self.run_on(DUE + timedelta(days=10)), 0)
        InvoiceService.set_disputed(self.rent, False)
        self.assertEqual(self.run_on(DUE + timedelta(days=10)), 1)
        # The penalty invoice itself is overdue now but is never penalized.
        self.assertEqual(self.run_on(DUE + timedelta(days=20)), 0)

    def test_waiving_a_penalty_with_a_credit_note(self):
        self.policy()
        self.run_on(DUE + timedelta(days=6))
        penalty = self.penalties()[0]
        InvoiceService.issue_credit_note(penalty, penalty.amount_due, 'First time — waived')
        penalty.refresh_from_db()
        self.assertEqual(penalty.status, 'waived')
        self.assertEqual(LedgerService.balance(self.org, chart.WAIVERS_AND_DISCOUNTS), D('1000.00'))

    def test_tenant_is_notified(self):
        self.policy()
        with patch(SMS) as sms:
            PenaltyService.run(as_of=DUE + timedelta(days=6))
        self.assertIn('late penalty of KES 1000.00', sms.call_args[0][1])


class PenaltyPolicyApiTests(PenaltyFixtures):
    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_landlord_reads_default_then_enables(self):
        client = self.client_for(self.landlord)
        default = client.get('/api/v1/penalty-policy/')
        self.assertEqual(default.status_code, 200)
        self.assertFalse(default.data['enabled'])
        self.assertIsNone(default.data['id'])

        invalid = client.put('/api/v1/penalty-policy/', {'enabled': True, 'method': 'fixed', 'amount': '0'},
                             format='json')
        self.assertEqual(invalid.status_code, 400)

        saved = client.put('/api/v1/penalty-policy/', {'enabled': True, 'method': 'fixed', 'amount': '500.00'},
                           format='json')
        self.assertEqual(saved.status_code, 200, saved.data)
        self.assertTrue(PenaltyPolicy.objects.get(organization=self.org, parent_property=None).enabled)

        override = client.put(f'/api/v1/penalty-policy/?property_id={self.prop.id}', {'enabled': False},
                              format='json')
        self.assertEqual(override.status_code, 200)
        self.assertEqual(override.data['property'], self.prop.id)
        self.assertEqual(client.delete(f'/api/v1/penalty-policy/?property_id={self.prop.id}').status_code, 204)

    def test_tenant_and_other_landlords_forbidden(self):
        self.assertEqual(self.client_for(self.tenant_user).get('/api/v1/penalty-policy/').status_code, 403)
        intruder, _, _ = self.create_landlord_with_org('intruder@test.com')
        response = self.client_for(intruder).get(f'/api/v1/penalty-policy/?organization_id={self.org.id}')
        self.assertEqual(response.status_code, 403)
