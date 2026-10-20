"""Audience selection, personalisation and sending for bulk messages."""

from __future__ import annotations

import logging
import math
import re

from django.utils import timezone

from broadcasts.models import Broadcast, BroadcastDelivery
from properties.models import Tenancy

logger = logging.getLogger(__name__)
SMS_SEGMENT = 160
PLACEHOLDERS = ('name', 'unit', 'balance', 'account')
CURRENT = ('active', 'notice_period')


class BroadcastError(ValueError):
    pass


def audience(organization, kind: str, property_obj=None) -> list[Tenancy]:
    tenancies = Tenancy.objects.filter(organization=organization, status__in=CURRENT).select_related('tenant', 'unit')
    if kind == 'property':
        if property_obj is None:
            raise BroadcastError('Choose a property.')
        tenancies = tenancies.filter(parent_property=property_obj)
    tenancies = list(tenancies)
    if kind == 'arrears':
        from leasing.services import arrears
        tenancies = [t for t in tenancies if arrears(t) > 0]
    return tenancies


def personalise(template: str, tenancy: Tenancy) -> str:
    from leasing.services import arrears

    values = {
        'name': tenancy.tenant.full_name.split(' ')[0] if tenancy.tenant.full_name else '',
        'unit': tenancy.unit.unit_number,
        'balance': f'KES {arrears(tenancy):,.0f}',
        'account': tenancy.payment_reference,
    }
    return re.sub(r'\{(\w+)\}', lambda m: values.get(m.group(1), m.group(0)), template)


def preview(organization, kind: str, property_obj, message: str, send_sms: bool) -> dict:
    tenancies = audience(organization, kind, property_obj)
    samples = [personalise(message, t) for t in tenancies[:3]]
    segments = sum(math.ceil(len(personalise(message, t)) / SMS_SEGMENT) for t in tenancies if t.tenant.phone) if send_sms else 0
    return {
        'recipients': len(tenancies),
        'with_phone': sum(1 for t in tenancies if t.tenant.phone),
        'with_email': sum(1 for t in tenancies if t.tenant.email),
        'sms_segments': segments,
        'samples': samples,
        'unknown_placeholders': sorted(set(re.findall(r'\{(\w+)\}', message)) - set(PLACEHOLDERS)),
    }


def send(broadcast: Broadcast) -> Broadcast:
    from django.conf import settings
    from django.core.mail import EmailMessage

    from rent.services.notifications import _send_sms

    Broadcast.objects.filter(pk=broadcast.pk).update(status='sending')
    tenancies = audience(broadcast.organization, broadcast.audience, broadcast.parent_property)
    counts = {'recipients': len(tenancies), 'sms_sent': 0, 'sms_segments': 0, 'emails_sent': 0, 'failures': 0}
    for tenancy in tenancies:
        text = personalise(broadcast.message, tenancy)
        tenant = tenancy.tenant
        if broadcast.send_sms and tenant.phone:
            ok = _send_sms(tenant.phone, text)
            BroadcastDelivery.objects.create(broadcast=broadcast, tenant=tenant, channel='sms', ok=ok)
            if ok:
                counts['sms_sent'] += 1
                counts['sms_segments'] += math.ceil(len(text) / SMS_SEGMENT)
            else:
                counts['failures'] += 1
        if broadcast.send_email and tenant.email:
            try:
                EmailMessage(subject=broadcast.subject or broadcast.organization.name, body=text,
                             from_email=settings.DEFAULT_FROM_EMAIL, to=[tenant.email]).send(fail_silently=False)
                ok = True
            except Exception:
                logger.exception('Broadcast email failed for tenant %s', tenant.pk)
                ok = False
            BroadcastDelivery.objects.create(broadcast=broadcast, tenant=tenant, channel='email', ok=ok)
            counts['emails_sent' if ok else 'failures'] += 1
    Broadcast.objects.filter(pk=broadcast.pk).update(status='sent', finished_at=timezone.now(), **counts)
    broadcast.refresh_from_db()
    return broadcast
