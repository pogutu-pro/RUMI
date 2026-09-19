import logging

import requests
from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.models import log_audit
from core.permissions.rumia import get_canonical_role

from . import service
from .registry import BY_KEY, GROUPS, SPECS, SettingError

logger = logging.getLogger(__name__)


class _SuperAdminOnly(APIView):
    """Keys are the most sensitive thing in the system: super admin only, no exceptions."""

    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if get_canonical_role(request.user) != 'super_admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only a super admin can manage platform settings.')


class SettingListView(_SuperAdminOnly):
    def get(self, request):
        groups = []
        for group_id, (title, blurb) in GROUPS.items():
            groups.append({
                'id': group_id,
                'title': title,
                'description': blurb,
                'settings': [service.describe(s) for s in SPECS if s.group == group_id],
            })
        return Response({'groups': groups})


class SettingDetailView(_SuperAdminOnly):
    def _spec(self, key):
        return BY_KEY.get(key)

    def put(self, request, key):
        spec = self._spec(key)
        if spec is None:
            return Response({'detail': 'Unknown setting.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            value = service.set_value(key, request.data.get('value'), user=request.user)
        except SettingError as exc:
            return Response({'detail': str(exc), 'errors': {'value': str(exc)}}, status=status.HTTP_400_BAD_REQUEST)

        # Never write a secret into the audit trail, not even a fragment.
        log_audit(
            'platform_setting_updated', actor=request.user,
            metadata={'key': key, 'secret': spec.secret, **({} if spec.secret else {'value': str(value)})},
        )
        return Response(service.describe(spec))

    def delete(self, request, key):
        spec = self._spec(key)
        if spec is None:
            return Response({'detail': 'Unknown setting.'}, status=status.HTTP_404_NOT_FOUND)
        removed = service.clear_value(key)
        if removed:
            log_audit('platform_setting_cleared', actor=request.user, metadata={'key': key})
        return Response(service.describe(spec))


class TestPaystackView(_SuperAdminOnly):
    """Ask Paystack something harmless to prove the current key is accepted."""

    def post(self, request):
        secret = getattr(settings, 'PAYSTACK_SECRET_KEY', '') or ''
        if not secret:
            return Response({'ok': False, 'detail': 'No Paystack secret key is set.'})

        env = getattr(settings, 'PAYSTACK_ENV', 'test') or 'test'
        key_mode = 'live' if secret.startswith('sk_live_') else 'test' if secret.startswith('sk_test_') else 'unknown'
        warning = ''
        if key_mode != 'unknown' and key_mode != env:
            warning = (f'This is a {key_mode} key but Mode is set to {env}. Payments will be refused until '
                       'they match.')
        try:
            response = requests.get(
                'https://api.paystack.co/bank', params={'country': 'kenya', 'perPage': 1},
                headers={'Authorization': f'Bearer {secret}'}, timeout=15,
            )
        except requests.RequestException as exc:
            return Response({'ok': False, 'detail': f'Could not reach Paystack: {exc}', 'mode': key_mode})

        if response.status_code == 200:
            return Response({'ok': True, 'detail': f'Paystack accepted the key ({key_mode} mode).',
                             'mode': key_mode, 'warning': warning})
        try:
            reason = response.json().get('message', '')
        except ValueError:
            reason = ''
        return Response({'ok': False, 'detail': f'Paystack refused the key: {reason or response.status_code}.',
                         'mode': key_mode, 'warning': warning})


class TestEmailView(_SuperAdminOnly):
    """Send a real test message to the signed-in admin through the current SMTP settings."""

    def post(self, request):
        try:
            sent = send_mail(
                'RumiaRent email test',
                'This is a test from your RumiaRent platform settings. If you can read this, email is working.',
                settings.DEFAULT_FROM_EMAIL, [request.user.email], fail_silently=False,
            )
        except Exception as exc:  # noqa: BLE001 - report any SMTP failure to the admin
            logger.warning('Test email failed: %s', exc)
            return Response({'ok': False, 'detail': f'The email could not be sent: {exc}'})
        return Response({
            'ok': bool(sent),
            'detail': f'Test email sent to {request.user.email}.' if sent else 'The SMTP server accepted no recipients.',
        })


class TestSmsView(_SuperAdminOnly):
    """Send one real text to the admin's own phone. Costs a shilling or so, so it is explicit."""

    def post(self, request):
        from notifications.tasks import send_sms_via_africastalking

        phone = request.user.phone_number
        if not phone:
            return Response({'ok': False, 'detail': 'Add your phone number in Settings first.'})
        try:
            send_sms_via_africastalking(phone, 'RumiaRent: your SMS settings are working.')
        except Exception as exc:  # noqa: BLE001
            return Response({'ok': False, 'detail': f'The text could not be sent: {exc}'})
        return Response({'ok': True, 'detail': f'Test text sent to {phone}.'})
