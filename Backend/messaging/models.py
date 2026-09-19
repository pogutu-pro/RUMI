"""
Direct messages between RumiaRent users - separate from support tickets,
which are for problems with the system itself.

A conversation is always between exactly two users. The pair is stored in a
canonical order (lower id first) so there is only ever one conversation per
pair, however it was started.
"""

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_a = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='+')
    user_b = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='+')
    created_at = models.DateTimeField(default=timezone.now)
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_message_preview = models.CharField(max_length=140, blank=True, default='')
    # Anything sent by the other person after this moment is "unread".
    user_a_last_read_at = models.DateTimeField(null=True, blank=True)
    user_b_last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'messaging_conversation'
        constraints = [
            models.UniqueConstraint(fields=['user_a', 'user_b'], name='uniq_messaging_pair'),
            models.CheckConstraint(check=models.Q(user_a__lt=models.F('user_b')), name='messaging_pair_ordered'),
        ]
        ordering = ['-last_message_at', '-created_at']

    def other_user(self, user):
        return self.user_b if user.id == self.user_a_id else self.user_a

    def includes(self, user) -> bool:
        return user.id in (self.user_a_id, self.user_b_id)

    def last_read_by(self, user):
        return self.user_a_last_read_at if user.id == self.user_a_id else self.user_b_last_read_at

    def unread_count_for(self, user) -> int:
        since = self.last_read_by(user)
        unread = self.messages.exclude(sender=user)
        if since:
            unread = unread.filter(created_at__gt=since)
        return unread.count()

    @classmethod
    def between(cls, first, second):
        """Get or create the single conversation for this pair."""
        low, high = (first, second) if first.id < second.id else (second, first)
        conversation, _ = cls.objects.get_or_create(user_a=low, user_b=high)
        return conversation


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='+')
    body = models.TextField()
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = 'messaging_message'
        ordering = ['created_at']
