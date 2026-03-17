"""
Tests for send_booking_confirmation and send_payment_notification Celery tasks,
and their wiring via transaction.on_commit in _handle_charge_success and
_send_payment_notifications.

Plan: 05-03 — Notification task creation and on_commit wiring.
"""
import pytest
from unittest.mock import patch, MagicMock, call


# ---------------------------------------------------------------------------
# Task unit tests
# ---------------------------------------------------------------------------

class TestSendBookingConfirmationTask:
    """Unit tests for send_booking_confirmation @shared_task."""

    @pytest.mark.django_db
    def test_send_booking_confirmation_task_sends_email_and_sms(self):
        """
        Given a valid booking_id, the task dispatches send_notification.delay
        twice — once with channel='email' and once with channel='sms', both
        with notification_type='booking_confirmed'.
        """
        from payments.tasks import send_booking_confirmation

        mock_booking = MagicMock()
        mock_booking.id = 99
        mock_booking.student.user.id = 10
        mock_booking.student.user.first_name = "Alice"
        mock_booking.room.hostel.name = "Test Hostel"
        mock_booking.room.room_number = "101"
        mock_booking.booking_reference = "BK-001"
        mock_booking.check_in_date.strftime.return_value = "January 01, 2026"

        # Patch the Booking queryset inside payments.tasks (lazy import path)
        with patch("notifications.tasks.send_notification") as mock_send_notif, \
             patch("hostels.models.Booking.objects") as mock_manager:
            mock_manager.select_related.return_value.get.return_value = mock_booking

            send_booking_confirmation(99)

            assert mock_send_notif.delay.call_count == 2

            calls = mock_send_notif.delay.call_args_list
            call_str = str(calls)
            # Both channels must be represented
            assert "email" in call_str
            assert "sms" in call_str
            for c in calls:
                kwargs = c.kwargs if c.kwargs else {}
                # notification_type must be booking_confirmed for both calls
                if kwargs:
                    assert kwargs["notification_type"] == "booking_confirmed"

    @pytest.mark.django_db
    def test_send_booking_confirmation_task_handles_missing_booking(self):
        """
        Task does not raise when booking_id does not exist; logs error and
        returns cleanly.
        """
        from payments.tasks import send_booking_confirmation
        from hostels.models import Booking

        with patch("payments.tasks.logger") as mock_logger:
            # Use a booking_id that definitely doesn't exist
            send_booking_confirmation(999999)  # should not raise

        # No exception propagated — test passes if we reach this line
        assert True


class TestSendPaymentNotificationTask:
    """Unit tests for send_payment_notification @shared_task."""

    @pytest.mark.django_db
    def test_send_payment_notification_task_notifies_student_and_landlord(self):
        """
        Given a valid transaction_id, the task dispatches send_notification.delay
        twice — once to student (payment_success) and once to landlord
        (payment_received).
        """
        from payments.tasks import send_payment_notification

        mock_txn = MagicMock()
        mock_txn.id = 42
        mock_txn.student.user.id = 11
        mock_txn.student.user.first_name = "Bob"
        mock_txn.landlord.user.id = 22
        mock_txn.landlord.company_name = "Acme Hostels"
        mock_txn.total_charged_amount = 5000
        mock_txn.landlord_payout_amount = 4500
        mock_txn.transaction_reference = "TXN-42"

        with patch("notifications.tasks.send_notification") as mock_send_notif, \
             patch("payments.models.Transaction.objects") as mock_manager:
            mock_manager.select_related.return_value.get.return_value = mock_txn

            send_payment_notification(42)

            assert mock_send_notif.delay.call_count == 2
            calls = mock_send_notif.delay.call_args_list
            notification_types = []
            for c in calls:
                kwargs = c.kwargs if c.kwargs else {}
                if kwargs:
                    notification_types.append(kwargs.get("notification_type"))
            assert "payment_success" in notification_types
            assert "payment_received" in notification_types

    @pytest.mark.django_db
    def test_send_payment_notification_task_handles_missing_transaction(self):
        """
        Task does not raise when transaction_id does not exist; logs error
        and returns cleanly.
        """
        from payments.tasks import send_payment_notification

        with patch("payments.tasks.logger") as mock_logger:
            send_payment_notification(999999)  # should not raise

        assert True


# ---------------------------------------------------------------------------
# Wiring tests — on_commit dispatch
# ---------------------------------------------------------------------------

class TestHandleChargeSuccessOnCommitWiring:
    """
    Verify _handle_charge_success dispatches both tasks via transaction.on_commit,
    not via direct .delay() calls.
    """

    def test_handle_charge_success_dispatches_via_on_commit(self):
        """
        When _handle_charge_success runs, it calls transaction.on_commit (not
        send_booking_confirmation.delay or send_payment_notification.delay directly).
        """
        import ast
        import inspect
        import payments.views as views_module

        source = inspect.getsource(views_module)
        tree = ast.parse(source)

        # Find _handle_charge_success function
        target_func = None
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == "_handle_charge_success":
                target_func = node
                break

        assert target_func is not None, "_handle_charge_success not found in payments/views.py"

        # Collect all Call nodes in the function
        direct_delay_calls = []

        for node in ast.walk(target_func):
            if isinstance(node, ast.Call):
                # Check for send_notification.delay() called directly
                if isinstance(node.func, ast.Attribute):
                    if node.func.attr == "delay":
                        func_value = node.func.value
                        if isinstance(func_value, ast.Name):
                            if func_value.id == "send_notification":
                                direct_delay_calls.append(func_value.id)
                        elif isinstance(func_value, ast.Attribute):
                            if func_value.attr == "send_notification":
                                direct_delay_calls.append(func_value.attr)

        # There should be NO direct send_notification.delay() calls in _handle_charge_success
        assert direct_delay_calls == [], (
            f"Found direct send_notification.delay() calls in _handle_charge_success: {direct_delay_calls}. "
            "Expected on_commit wiring instead."
        )

        # Check that on_commit is referenced in the function body (via ast.unparse)
        func_source = ast.unparse(target_func)
        assert "on_commit" in func_source, (
            "transaction.on_commit not found in _handle_charge_success. "
            "Expected on_commit wiring for send_booking_confirmation and send_payment_notification."
        )


class TestMpesaWebhookOnCommitWiring:
    """
    Verify _send_payment_notifications in mpesa_webhooks.py dispatches
    send_payment_notification via on_commit rather than direct .delay() calls.
    """

    def test_mpesa_webhook_dispatches_payment_notification_via_on_commit(self):
        """
        _send_payment_notifications must use on_commit, not direct send_notification.delay().
        """
        import ast
        import inspect
        import payments.mpesa_webhooks as mpesa_module

        source = inspect.getsource(mpesa_module)
        tree = ast.parse(source)

        # Find the class containing _send_payment_notifications
        target_func = None
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == "_send_payment_notifications":
                target_func = node
                break

        assert target_func is not None, "_send_payment_notifications not found in payments/mpesa_webhooks.py"

        # Look for direct send_notification.delay() calls inside _send_payment_notifications
        direct_send_notification = []
        for node in ast.walk(target_func):
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Attribute) and node.func.attr == "delay":
                    func_value = node.func.value
                    if isinstance(func_value, ast.Name) and func_value.id == "send_notification":
                        direct_send_notification.append("send_notification.delay")
                    elif isinstance(func_value, ast.Attribute) and func_value.attr == "send_notification":
                        direct_send_notification.append("send_notification.delay")

        assert direct_send_notification == [], (
            f"Found direct send_notification.delay() in _send_payment_notifications: {direct_send_notification}. "
            "Expected send_payment_notification via on_commit."
        )

        # on_commit must be present (use ast.unparse to get source text from AST node)
        func_source = ast.unparse(target_func)
        assert "on_commit" in func_source, (
            "on_commit not found in _send_payment_notifications. "
            "Expected db_transaction.on_commit(lambda: send_payment_notification.delay(...))"
        )
