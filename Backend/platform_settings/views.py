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

from . import service, social
from .registry import BY_KEY, GROUPS, SPECS, SettingError

logger = logging.getLogger(__name__)


class _SuperAdminOnly(APIView):
    """
    Keys are the most sensitive thing in the system: super admin only, and the
    admin must have re-entered their password recently (see UnlockView).
    """

    permission_classes = [IsAuthenticated]
    requires_unlock = True

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        from rest_framework.exceptions import PermissionDenied

        if get_canonical_role(request.user) != 'super_admin':
            raise PermissionDenied('Only a super admin can manage platform settings.')
        if self.requires_unlock and not service.is_unlocked(request.user):
            raise PermissionDenied('Enter your password to open Integrations.', code='reauth_required')


class UnlockStatusView(_SuperAdminOnly):
    requires_unlock = False

    def get(self, request):
        left = service.unlocked_seconds_left(request.user)
        return Response({'unlocked': left > 0, 'seconds_left': left})


class UnlockView(_SuperAdminOnly):
    """Check the signed-in super admin's password and open Integrations for a few minutes."""

    requires_unlock = False

    def post(self, request):
        if service.too_many_failures(request.user):
            return Response(
                {'detail': 'Too many wrong passwords. Try again in 15 minutes.', 'code': 'too_many_attempts'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        password = request.data.get('password') or ''
        if not password or not request.user.check_password(password):
            attempts = service.record_failure(request.user)
            log_audit('platform_settings_unlock_failed', actor=request.user, metadata={'attempt': attempts})
            return Response({'detail': 'That password is not correct.', 'code': 'wrong_password'},
                            status=status.HTTP_400_BAD_REQUEST)

        service.unlock(request.user)
        log_audit('platform_settings_unlocked', actor=request.user)
        return Response({'unlocked': True, 'seconds_left': service.unlocked_seconds_left(request.user)})


class LockView(_SuperAdminOnly):
    requires_unlock = False

    def post(self, request):
        service.lock(request.user)
        return Response({'unlocked': False, 'seconds_left': 0})


class SocialLinkAdminListView(_SuperAdminOnly):
    """Every supported platform with its current link (blank if none)."""

    def get(self, request):
        from home.models import SocialLink

        current = {l.platform: l.url for l in SocialLink.objects.all()}
        return Response({'results': [
            {'platform': pid, 'label': label, 'url': current.get(pid, ''), 'example': f'https://{hosts[0]}/rumiarent'}
            for pid, (label, hosts) in social.PLATFORMS.items()
        ]})


class SocialLinkAdminDetailView(_SuperAdminOnly):
    def put(self, request, platform):
        from home.models import SocialLink
        from home.views import invalidate_public_social_cache

        try:
            url = social.validate_link(platform, request.data.get('url'))
        except SettingError as exc:
            return Response({'detail': str(exc), 'errors': {'url': str(exc)}}, status=status.HTTP_400_BAD_REQUEST)
        SocialLink.objects.update_or_create(platform=platform, defaults={'url': url, 'updated_by': request.user})
        invalidate_public_social_cache()
        log_audit('social_link_updated', actor=request.user, metadata={'platform': platform, 'url': url})
        return Response({'platform': platform, 'url': url})

    def delete(self, request, platform):
        from home.models import SocialLink
        from home.views import invalidate_public_social_cache

        if platform not in social.PLATFORMS:
            return Response({'detail': 'Unknown platform.'}, status=status.HTTP_404_NOT_FOUND)
        deleted, _ = SocialLink.objects.filter(platform=platform).delete()
        invalidate_public_social_cache()
        if deleted:
            log_audit('social_link_removed', actor=request.user, metadata={'platform': platform})
        return Response({'platform': platform, 'url': ''})


class TaxRatesView(_SuperAdminOnly):
    """
    The rental income tax (MRI) parameters every landlord's figures use. They
    have changed before (10% to 7.5% in 2024), so they are edited here rather
    than in code. A change applies to every landlord's next calculation.
    """

    FIELDS = ('mri_rate', 'mri_annual_min', 'mri_annual_max', 'filing_due_day')

    @staticmethod
    def _data(config):
        return {
            'mri_rate': str(config.mri_rate), 'mri_annual_min': str(config.mri_annual_min),
            'mri_annual_max': str(config.mri_annual_max), 'filing_due_day': config.filing_due_day,
        }

    def get(self, request):
        from accounting.models import TaxRateConfig
        return Response(self._data(TaxRateConfig.get()))

    def put(self, request):
        from decimal import Decimal, InvalidOperation

        from accounting.models import TaxRateConfig

        config = TaxRateConfig.get()
        before = self._data(config)
        errors = {}
        try:
            rate = Decimal(str(request.data.get('mri_rate')))
            if not (Decimal('0') < rate <= Decimal('30')):
                raise InvalidOperation
            config.mri_rate = rate
        except (InvalidOperation, TypeError):
            errors['mri_rate'] = 'Enter a rate between 0 and 30 (for example 7.5).'
        try:
            low = Decimal(str(request.data.get('mri_annual_min')))
            high = Decimal(str(request.data.get('mri_annual_max')))
            if low < 0 or high <= low:
                raise InvalidOperation
            config.mri_annual_min, config.mri_annual_max = low, high
        except (InvalidOperation, TypeError):
            errors['mri_annual_min'] = 'The upper limit must be higher than the lower limit.'
        try:
            day = int(request.data.get('filing_due_day'))
            if not 1 <= day <= 28:
                raise ValueError
            config.filing_due_day = day
        except (TypeError, ValueError):
            errors['filing_due_day'] = 'Enter a day of the month from 1 to 28.'
        if errors:
            return Response({'detail': 'Please fix the highlighted fields.', 'errors': errors},
                            status=status.HTTP_400_BAD_REQUEST)
        config.updated_by = request.user
        config.save()
        log_audit('tax_rates_updated', actor=request.user, old_value=before, new_value=self._data(config))
        return Response(self._data(config))


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
