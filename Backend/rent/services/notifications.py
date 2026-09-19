"""
RumiaRent rental notifications — rent due reminder, payment confirmation only.

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
from django.core.mail import EmailMessage

from notifications.tasks import send_sms_via_africastalking

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, body: str) -> bool:
    if not to_email:
        return False
    try:
        EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        ).send(fail_silently=False)
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
    _send_email(tenant.email, subject, body)

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
    _send_email(tenant.email, subject, body)

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
    _send_email(contact.email, subject, body)

    sms_text = (
        f'RumiaRent: {tenant.full_name} has an overdue rent balance of KES {amount} '
        f'for unit {unit_label}. You are listed as their contact for this.'
    )
    _send_sms(contact.phone, sms_text)
