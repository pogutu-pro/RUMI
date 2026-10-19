"""Phase 1f — EscalationPolicy-driven reminders and ReminderLog."""

from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core import mail

from notifications.models import Notification
from rent.models import ReminderLog
from rent.services.invoicing import InvoiceService, LineSpec
from rent.services.reminders import ReminderService, schedule_for
from rumia_api.tests import RumiaTestFixtures
from tenants.models import EscalationPolicy

D = Decimal
DUE = date(2026, 5, 10)
SMS = 'rent.services.notifications.send_sms_via_africastalking'


class ReminderTests(RumiaTestFixtures):
    def setUp(self):
        self.landlord, _, self.org = self.create_landlord_with_org()
        self.prop, self.unit = self.create_property_with_unit(self.org)
        self.tenant_user, self.tenant = self.create_tenant(self.org)
        self.tenancy = self.create_tenancy(self.org, self.prop, self.unit, self.tenant)
        self.policy = EscalationPolicy.objects.get(organization=self.org)
        self.policy.overdue_reminder_days = [1, 3, 7]
        self.policy.notification_channels = ['sms', 'email', 'in_app']
        self.policy.save()
        self.invoice = InvoiceService.create_invoice(
            self.tenancy, 'rent', [LineSpec('rent', D('22000'))],
            period_start=date(2026, 5, 1), period_end=date(2026, 5, 31), due_date=DUE, as_of=date(2026, 5, 1),
        )

    def run_on(self, day):
        with patch(SMS) as sms:
            counts = ReminderService.run(as_of=day)
        return counts, sms

    def keys(self, skipped=None):
        logs = ReminderLog.objects.filter(invoice=self.invoice)
        if skipped is not None:
            logs = logs.filter(skipped=skipped)
        return sorted(logs.values_list('reminder_key', flat=True))

    def test_schedule_follows_policy(self):
        keys = [key for key, _, _ in schedule_for(self.invoice, self.policy)]
        self.assertEqual(keys, [
            'before_7', 'before_3', 'due', 'overdue_1', 'overdue_3', 'overdue_7',
            'caretaker_escalation', 'landlord_escalation',
        ])

    def test_each_step_sent_once_on_its_day(self):
        counts, sms = self.run_on(DUE - timedelta(days=7))
        self.assertEqual(counts['sent'], 1)
        sms.assert_called_once()
        self.assertIn('due on 2026-05-10', sms.call_args[0][1])
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(Notification.objects.filter(recipient=self.tenant_user, channel='in_app').count(), 1)

        counts, sms = self.run_on(DUE - timedelta(days=7))  # same day again
        self.assertEqual(counts['sent'], 0)
        sms.assert_not_called()

        self.run_on(DUE)
        _, sms = self.run_on(DUE + timedelta(days=1))
        self.assertIn('1 day(s) overdue', sms.call_args[0][1])
        # On the due date before_3 and due were both pending: only 'due' went out.
        self.assertEqual(self.keys(skipped=False), ['before_7', 'due', 'overdue_1'])
        self.assertEqual(self.keys(skipped=True), ['before_3'])

    def test_catch_up_sends_only_latest_step_and_skips_stale_ones(self):
        counts, sms = self.run_on(DUE + timedelta(days=4))
        self.assertEqual(counts, {'sent': 1, 'skipped': 4})
        self.assertEqual(self.keys(skipped=False), ['overdue_3'])
        self.assertEqual(self.keys(skipped=True), ['before_3', 'before_7', 'due', 'overdue_1'])
        sms.assert_called_once()

    def test_paid_waived_and_disputed_invoices_are_not_chased(self):
        InvoiceService.set_disputed(self.invoice, True)
        counts, _ = self.run_on(DUE)
        self.assertEqual(counts['sent'], 0)

        InvoiceService.set_disputed(self.invoice, False)
        InvoiceService.issue_credit_note(self.invoice, '22000', 'Waived')
        counts, _ = self.run_on(DUE)
        self.assertEqual(counts['sent'], 0)

    def test_inactive_policy_sends_nothing(self):
        self.policy.is_active = False
        self.policy.save()
        self.assertEqual(self.run_on(DUE)[0]['sent'], 0)

    def test_landlord_escalation_goes_to_owner(self):
        self.policy.notification_channels = ['email']
        self.policy.save()
        self.run_on(DUE + timedelta(days=self.policy.landlord_escalation_after_days))
        recipients = [m.to[0] for m in mail.outbox]
        self.assertIn(self.landlord.email, recipients)
        self.assertIn(self.tenant.email, recipients)
        landlord_mail = next(m for m in mail.outbox if m.to[0] == self.landlord.email)
        self.assertIn('John Kamau', landlord_mail.subject)

    def test_one_failing_recipient_does_not_stop_the_run(self):
        with patch('rent.services.notifications.send_invoice_reminder', side_effect=RuntimeError('boom')):
            counts = ReminderService.run(as_of=DUE)
        self.assertEqual(counts['sent'], 1)
        self.assertIn('due', self.keys())
