"""
RumiaRent rental notifications — rent reminders, receipts, payment confirmation.

Deliberately minimal: no template management system, no escalation ladder.
Uses Django's configured EMAIL_BACKEND directly (Mailtrap in dev, real SMTP
in production — see rumi/settings.py, purely environment-driven) and the
existing, now-fixed Africa's Talking sender in notifications.tasks. Failures
in one channel never raise — a landlord/tenant with no phone on file, or a
transient provider error, must not break the payment/rent-generation flow
that triggered the notification.
"""

from __future__ import annotations

import logging

from django.conf import settings

from notifications.tasks import send_sms_via_africastalking

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, body: str, recipient_name: str = '') -> bool:
    if not to_email:
        return False
    from accounts.utils import send_branded_email

    try:
        send_branded_email(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            recipient_name=recipient_name,
            fail_silently=False,
        )
        return True
    except Exception:
        logger.exception('RumiaRent email notification failed (to=%s)', to_email)
        return False


def _send_sms(phone: str, message: str) -> bool:
    if not phone:
        return False
    try:
        send_sms_via_africastalking(phone, message)
        return True
    except Exception:
        logger.exception('RumiaRent SMS notification failed (phone=%s)', phone)
        return False


def send_rent_due_reminder(charge) -> None:
    """charge: rent.models.RentCharge"""
    tenant = charge.tenant
    unit_label = charge.unit.unit_number
    amount = charge.outstanding

    subject = 'Rent reminder: RumiaRent'
    body = (
        f'Hi {tenant.full_name},\n\n'
        f'This is a reminder that KES {amount} is due for unit {unit_label} '
        f'on {charge.due_date.isoformat()}.\n\n'
        f'Thank you.'
    )
    _send_email(tenant.email, subject, body, recipient_name=tenant.full_name)

    sms_text = (
        f'RumiaRent: KES {amount} rent due for unit {unit_label} on '
        f'{charge.due_date.isoformat()}.'
    )
    _send_sms(tenant.phone, sms_text)

    if getattr(tenant, 'user', None) is not None:
        from notifications.in_app import notify_in_app, role_url
        notify_in_app(
            tenant.user, notification_type='rent_reminder',
            subject='Rent reminder',
            message=f'KES {amount} is due for unit {unit_label} on {charge.due_date.isoformat()}.',
            url=role_url(tenant.user, 'rent'),
            dedupe_key=f'rent-charge:{charge.id}',
        )


def send_payment_confirmation(payment) -> None:
    """payment: rent.models.Payment (status must already be 'success')"""
    tenant = payment.tenant
    unit_label = payment.unit.unit_number if payment.unit else ''

    subject = 'Payment received: RumiaRent'
    body = (
        f'Hi {tenant.full_name},\n\n'
        f'We received your payment of KES {payment.amount} for unit {unit_label}.\n'
        f'Reference: {payment.internal_reference}\n'
        f'Date: {payment.paid_at.isoformat() if payment.paid_at else ""}\n\n'
        f'Thank you.'
    )
    _send_email(tenant.email, subject, body, recipient_name=tenant.full_name)

    sms_text = (
        f'RumiaRent: Payment of KES {payment.amount} received. '
        f'Ref: {payment.internal_reference}.'
    )
    _send_sms(tenant.phone, sms_text)


def send_next_of_kin_escalation(charge, contact) -> None:
    """
    charge: rent.models.RentCharge (overdue). contact: tenants.models.EmergencyContact.

    Only ever called when EscalationPolicy.allow_next_of_kin_rent_contact is
    True for the organization and the contact's purpose explicitly authorizes
    rent escalation — see tenants.models.EmergencyContact. Next-of-kin are
    never contacted about rent by default.
    """
    tenant = charge.tenant
    unit_label = charge.unit.unit_number
    amount = charge.outstanding

    subject = 'Overdue rent: RumiaRent'
    body = (
        f'Hi {contact.full_name},\n\n'
        f'You are listed as a contact for {tenant.full_name}, who has an overdue '
        f'rent balance of KES {amount} for unit {unit_label} (due {charge.due_date.isoformat()}).\n\n'
        f'Please help settle this balance or reach out to {tenant.full_name} directly.\n\n'
        f'Thank you.'
    )
    _send_email(contact.email, subject, body, recipient_name=contact.full_name)

    sms_text = (
        f'RumiaRent: {tenant.full_name} has an overdue rent balance of KES {amount} '
        f'for unit {unit_label}. You are listed as their contact for this.'
    )
    _send_sms(contact.phone, sms_text)


def send_receipt_email(receipt) -> bool:
    """Email the receipt PDF to the tenant. Returns True when sent."""
    tenant = receipt.payment.tenant
    if not tenant.email:
        return False
    s = receipt.snapshot
    body = (
        f'Hi {tenant.full_name},\n\n'
        f'Thank you — we received KES {s.get("amount")} for unit {s.get("unit")}.\n'
        f'Receipt: {receipt.number}\n'
        f'Balance after this payment: KES {s.get("balance_after")}\n\n'
        f'Your receipt is attached.\n\n'
        f'{s.get("organization_name", "")}'
    )
    try:
        message = EmailMessage(
            subject=f'Receipt {receipt.number}: RumiaRent',
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[tenant.email],
        )
        if receipt.pdf:
            receipt.pdf.open('rb')
            try:
                message.attach(f'{receipt.number}.pdf', receipt.pdf.read(), 'application/pdf')
            finally:
                receipt.pdf.close()
        message.send(fail_silently=False)
        return True
    except Exception:
        logger.exception('RumiaRent receipt email failed (receipt=%s)', receipt.number)
        return False


def send_receipt_sms(receipt) -> bool:
    """Short SMS receipt. Returns True when sent."""
    s = receipt.snapshot
    text = (
        f'RumiaRent: Received KES {s.get("amount")} for {s.get("unit")}. '
        f'Receipt {receipt.number}. Balance KES {s.get("balance_after")}.'
    )
    return _send_sms(receipt.payment.tenant.phone, text)


def _in_app(user, notification_type: str, subject: str, message: str, metadata: dict) -> None:
    if user is None:
        return
    try:
        from django.utils import timezone

        from notifications.models import Notification

        Notification.objects.create(
            recipient=user, notification_type=notification_type, channel='in_app', subject=subject,
            message=message, metadata=metadata, status='sent', sent_at=timezone.now(),
        )
    except Exception:
        logger.exception('RumiaRent in-app notification failed (user=%s)', getattr(user, 'pk', None))


def _deliver(channels, *, email: str, phone: str, user, subject: str, body: str, sms: str, kind: str, metadata: dict):
    if 'email' in channels:
        _send_email(email, subject, body)
    if 'sms' in channels:
        _send_sms(phone, sms)
    if 'in_app' in channels:
        _in_app(user, kind, subject, sms, metadata)


def send_invoice_reminder(invoice, key: str, channels, as_of) -> None:
    """Tenant reminder for one step of the EscalationPolicy schedule (see rent.services.reminders)."""
    tenant = invoice.tenant
    unit = invoice.unit.unit_number
    amount = invoice.outstanding
    due = invoice.due_date.isoformat()
    what = invoice.get_invoice_type_display().lower()

    if key.startswith('before_'):
        subject = f'Upcoming {what}: KES {amount} due {due}'
        sms = f'RumiaRent: KES {amount} {what} for {unit} is due on {due} ({invoice.number}).'
    elif key == 'due':
        subject = f'{what.capitalize()} due today: KES {amount}'
        sms = f'RumiaRent: KES {amount} {what} for {unit} is due today ({invoice.number}).'
    else:
        days = (as_of - invoice.due_date).days
        subject = f'Overdue {what}: KES {amount}'
        sms = f'RumiaRent: KES {amount} {what} for {unit} is {days} day(s) overdue ({invoice.number}). Please pay to avoid penalties.'
    body = f'Hi {tenant.full_name},\n\n{sms.removeprefix("RumiaRent: ")}\n\nThank you.\n{invoice.organization.name}'

    _deliver(
        channels, email=tenant.email, phone=tenant.phone, user=tenant.user, subject=subject, body=body, sms=sms,
        kind='rent_reminder', metadata={'invoice_id': str(invoice.pk), 'step': key},
    )


def send_overdue_escalation(invoice, audience: str, channels, as_of) -> None:
    """Tell assigned caretakers (audience='caretaker') or the owner ('landlord') a tenant is overdue."""
    from accounts.models import User
    from properties.models import CaretakerPropertyAssignment

    if audience == 'landlord':
        recipients = [invoice.organization.owner]
    else:
        user_ids = CaretakerPropertyAssignment.objects.filter(
            organization=invoice.organization, property_assignment=invoice.parent_property, is_active=True,
        ).values_list('caretaker_profile__user', flat=True)
        recipients = list(User.objects.filter(pk__in=user_ids))

    days = (as_of - invoice.due_date).days
    sms = (
        f'RumiaRent: {invoice.tenant.full_name} ({invoice.unit.unit_number}, {invoice.parent_property.name}) '
        f'is {days} days overdue on {invoice.number}: KES {invoice.outstanding}.'
    )
    for user in recipients:
        _deliver(
            channels, email=user.email, phone=getattr(user, 'phone_number', ''), user=user,
            subject=f'Overdue tenant: {invoice.tenant.full_name} — KES {invoice.outstanding}',
            body=f'Hi,\n\n{sms.removeprefix("RumiaRent: ")}\n\nRumiaRent',
            sms=sms, kind='rent_overdue_escalation', metadata={'invoice_id': str(invoice.pk), 'audience': audience},
        )
