"""M-Pesa webhook helpers.

This module contains the transaction-safe notification dispatch used when an
M-Pesa payment callback completes successfully. Notifications are scheduled with
`transaction.on_commit` so they run only after the database transaction commits.
"""

from django.db import transaction

from payments.tasks import send_payment_notification


def _send_payment_notifications(transaction_id):
    """Schedule payment notifications after the transaction is committed."""
    transaction.on_commit(
        lambda: send_payment_notification.delay(transaction_id)
    )
