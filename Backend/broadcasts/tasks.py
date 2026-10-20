from celery import shared_task


@shared_task(name='broadcasts.tasks.send_broadcast')
def send_broadcast(broadcast_id):
    from broadcasts.models import Broadcast
    from broadcasts.services import send

    broadcast = Broadcast.objects.filter(pk=broadcast_id, status='queued').select_related('organization').first()
    if broadcast is not None:
        send(broadcast)
