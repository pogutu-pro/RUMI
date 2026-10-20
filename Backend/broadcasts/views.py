from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.response import Response

from accounting.books_views import OwnerScopedView
from audit.models import log_audit
from broadcasts.models import Broadcast
from broadcasts.services import BroadcastError, preview
from properties.models import Property


class BroadcastSerializer(serializers.ModelSerializer):
    property = serializers.PrimaryKeyRelatedField(source='parent_property', queryset=Property.objects.all(),
                                                  required=False, allow_null=True)

    class Meta:
        model = Broadcast
        fields = ['id', 'audience', 'property', 'send_sms', 'send_email', 'subject', 'message', 'status',
                  'recipients', 'sms_sent', 'sms_segments', 'emails_sent', 'failures', 'created_at', 'finished_at']
        read_only_fields = ['id', 'status', 'recipients', 'sms_sent', 'sms_segments', 'emails_sent', 'failures',
                            'created_at', 'finished_at']

    def validate(self, attrs):
        if not attrs.get('send_sms') and not attrs.get('send_email'):
            raise serializers.ValidationError('Choose SMS, email or both.')
        if len(attrs.get('message', '').strip()) < 5:
            raise serializers.ValidationError({'message': 'Write a message.'})
        return attrs


class BroadcastView(OwnerScopedView):
    """GET history; POST {…, preview: true} to preview, without it to send."""

    def get(self, request):
        org = self.organization(request)
        if org is None:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        return Response(BroadcastSerializer(Broadcast.objects.filter(organization=org)[:100], many=True).data)

    def post(self, request):
        org = self.organization(request)
        if org is None:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        serializer = BroadcastSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prop = serializer.validated_data.get('parent_property')
        if prop is not None:
            get_object_or_404(Property, pk=prop.pk, organization=org)
        data = serializer.validated_data
        try:
            summary = preview(org, data['audience'], prop, data['message'], data.get('send_sms', True))
        except BroadcastError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        if str(request.data.get('preview', '')).lower() in ('1', 'true'):
            return Response(summary)
        if (org.settings or {}).get('bulk_sms_enabled') is False and data.get('send_sms'):
            return Response({'detail': 'Bulk SMS is turned off for your organization.'}, status=status.HTTP_400_BAD_REQUEST)
        if summary['recipients'] == 0:
            return Response({'detail': 'Nobody matches that audience.'}, status=status.HTTP_400_BAD_REQUEST)
        broadcast = serializer.save(organization=org, created_by=request.user)
        log_audit('other', actor=request.user, organization=org, entity=broadcast,
                  metadata={'broadcast': broadcast.audience, 'recipients': summary['recipients']})
        from broadcasts.tasks import send_broadcast
        transaction.on_commit(lambda: send_broadcast.delay(str(broadcast.pk)))
        return Response(BroadcastSerializer(broadcast).data, status=status.HTTP_201_CREATED)
