from django.conf import settings
from django.db import models


class PlatformSetting(models.Model):
    """
    A setting a super admin has changed from the dashboard, overriding the
    server's environment file. The value is stored encrypted, whatever the
    setting, so a database dump or backup never contains a readable key.
    """

    key = models.CharField(max_length=100, unique=True)
    encrypted_value = models.TextField()
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='+',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'platform_setting'

    def __str__(self):
        return self.key
