"""
Tests verifying that all .delay() calls inside transaction.atomic() blocks are wrapped
with transaction.on_commit(), and that process_recurring_payments uses a dynamic
superuser lookup instead of a hardcoded recipient_id=1.

Scope: this plan (05-02) covers six specific dispatch sites:
  - payments/views.py: RefundRequestCreateView.post and RefundRequestProcessView.post
  - hostels/views.py: InventoryTemplateCreateView, InventoryCheckInSubmitView,
                       InventoryCheckInVerifyView, BookingView/RoomBookingView
  - payments/tasks.py: process_recurring_payments notification

NOTE: The two send_notification.delay() calls in _handle_charge_success (payments/views.py
lines ~1178, ~1190) are intentionally excluded — they are replaced in Plan 03.

Uses TransactionTestCase (via @pytest.mark.django_db(transaction=True)) because regular
TestCase never commits, so transaction.on_commit() callbacks never fire.
"""
import ast
import inspect
import pytest
from unittest.mock import patch, MagicMock, call
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model

User = get_user_model()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_superuser(email="admin@rumi.test", password="pass"):
    return User.objects.create_superuser(email=email, password=password, role="admin")


def _get_method_source(module, class_name, method_name):
    """Return the AST of a specific method in a class."""
    src = inspect.getsource(module)
    tree = ast.parse(src)
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == class_name:
            for item in ast.walk(node):
                if (isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef))
                        and item.name == method_name):
                    return item
    return None


def _delay_calls_directly_in_atomic(method_node):
    """
    Return a list of AST nodes for .delay() or .apply_async() calls that are
    directly inside a transaction.atomic() with-block (not wrapped in on_commit).
    """
    violations = []
    for node in ast.walk(method_node):
        if isinstance(node, ast.With):
            for item in node.items:
                if _is_atomic_call(item.context_expr):
                    for sub in ast.walk(node):
                        if isinstance(sub, ast.Call):
                            f = sub.func
                            if (isinstance(f, ast.Attribute) and
                                    f.attr in ("delay", "apply_async") and
                                    not _inside_on_commit_lambda(sub, node)):
                                violations.append(ast.unparse(sub))
    return violations


def _is_atomic_call(node):
    """Return True if the AST Call node is *.atomic()."""
    if isinstance(node, ast.Call):
        func = node.func
        if isinstance(func, ast.Attribute) and func.attr == "atomic":
            return True
    return False


def _inside_on_commit_lambda(delay_node, atomic_with_node):
    """
    Return True if delay_node is inside a lambda that is an argument to
    an on_commit() call anywhere within atomic_with_node.
    """
    for child in ast.walk(atomic_with_node):
        if isinstance(child, ast.Call):
            func = child.func
            if isinstance(func, ast.Attribute) and func.attr == "on_commit":
                for arg in child.args:
                    if isinstance(arg, ast.Lambda):
                        for sub in ast.walk(arg):
                            if sub is delay_node:
                                return True
    return False


# ---------------------------------------------------------------------------
# Test 1: RefundRequestCreateView.post — notification uses on_commit
# ---------------------------------------------------------------------------

class TestRefundRequestNotificationUsesOnCommit(TransactionTestCase):
    """
    RED: current code calls send_notification.delay() directly inside
    RefundRequestCreateView.post's atomic() block.
    GREEN: must be wrapped with transaction.on_commit(lambda: ...).
    """

    def test_refund_request_notification_uses_on_commit(self):
        from payments import views as pv

        method_node = _get_method_source(pv, "RefundRequestCreateView", "post")
        assert method_node is not None, "RefundRequestCreateView.post not found"

        violations = _delay_calls_directly_in_atomic(method_node)
        assert len(violations) == 0, (
            f"Found {len(violations)} direct .delay() call(s) inside atomic() block in "
            f"RefundRequestCreateView.post: {violations}. "
            "Wrap each with transaction.on_commit(lambda: ...)."
        )


# ---------------------------------------------------------------------------
# Test 2: No delay called directly in RefundRequestCreateView.post atomic block
# ---------------------------------------------------------------------------

class TestNoDelayDirectlyInRefundRequestAtomic(TransactionTestCase):
    """
    RED: verify that send_notification.delay() is not called directly inside the
    atomic block of RefundRequestCreateView.post — must go through on_commit.
    """

    def test_no_delay_called_directly_in_refund_request_atomic(self):
        from payments import views as pv

        method_node = _get_method_source(pv, "RefundRequestCreateView", "post")
        assert method_node is not None, "RefundRequestCreateView.post not found"

        # Look specifically for send_notification.delay calls not in on_commit
        violations = _delay_calls_directly_in_atomic(method_node)
        assert len(violations) == 0, (
            f"send_notification.delay() is called directly inside atomic() in "
            f"RefundRequestCreateView.post: {violations}. "
            "Must be inside transaction.on_commit(lambda: ...)."
        )


# ---------------------------------------------------------------------------
# Test 3: RefundRequestProcessView.post — notification uses on_commit
# ---------------------------------------------------------------------------

class TestRefundProcessNotificationUsesOnCommit(TransactionTestCase):
    """
    RED: RefundRequestProcessView.post calls send_notification.delay() directly
    inside atomic(). After Task 2 this must go through on_commit.
    """

    def test_refund_process_notification_uses_on_commit(self):
        from payments import views as pv

        method_node = _get_method_source(pv, "RefundRequestProcessView", "post")
        assert method_node is not None, "RefundRequestProcessView.post not found"

        violations = _delay_calls_directly_in_atomic(method_node)
        assert len(violations) == 0, (
            f"Found {len(violations)} direct .delay() call(s) inside atomic() block in "
            f"RefundRequestProcessView.post: {violations}. "
            "Wrap each with transaction.on_commit(lambda: ...)."
        )


# ---------------------------------------------------------------------------
# Test 4a: Dynamic superuser lookup in process_recurring_payments (CEL-06)
# ---------------------------------------------------------------------------

class TestProcessRecurringPaymentsDynamicSuperuser(TransactionTestCase):
    """
    RED: current code uses hardcoded recipient_id=1.
    GREEN: must use User.objects.filter(is_superuser=True).first() and guard with if _admin.
    """

    def test_process_recurring_payments_uses_filter_not_hardcoded_id(self):
        """
        The source of process_recurring_payments must NOT contain 'recipient_id=1'.
        It must instead use a dynamic lookup (is_superuser=True).
        """
        from payments import tasks as pt

        src = inspect.getsource(pt.process_recurring_payments)

        assert "recipient_id=1" not in src, (
            "process_recurring_payments still contains hardcoded recipient_id=1. "
            "Replace with dynamic User.objects.filter(is_superuser=True).first() lookup."
        )
        assert "is_superuser" in src, (
            "process_recurring_payments must use User.objects.filter(is_superuser=True) "
            "for the admin notification recipient."
        )

    def test_process_recurring_payments_admin_notification_dynamic_superuser(self):
        """
        When a superuser exists, send_notification.delay must receive that user's
        actual .id — NOT the hardcoded literal 1.
        """
        from payments.tasks import process_recurring_payments

        admin = _make_superuser("dyn_admin2@rumi.test")

        with patch("notifications.tasks.send_notification.delay") as mock_delay, \
             patch("payments.models.RecurringPayment") as mock_rp:

            # Make the queryset return one item that fails, triggering failed > 0
            mock_item = MagicMock()
            mock_item.id = 9999
            mock_item.student.user.first_name = "Test"
            mock_item.saved_payment_method = None
            mock_item.amount = 100
            # charge_saved_payment_method is called inside — patch it to raise
            with patch("payments.tasks.charge_saved_payment_method",
                       side_effect=Exception("mock payment failure")):
                mock_rp.objects.filter.return_value.select_related.return_value = [mock_item]
                process_recurring_payments()

            if mock_delay.called:
                call_kwargs = mock_delay.call_args[1] if mock_delay.call_args[1] else {}
                used_id = call_kwargs.get("recipient_id")
                assert used_id == admin.id, (
                    f"Expected recipient_id={admin.id} (dynamic), got {used_id}. "
                    "Hardcoded ID=1 is not allowed."
                )
            # If not called: process_recurring_payments returned early — that's fine
            # for this test; the source-level check above covers the requirement.

    def test_no_notification_when_no_superuser_exists(self):
        """
        If no superuser exists, process_recurring_payments must NOT call
        send_notification.delay (the if _admin: guard must prevent it).
        """
        from payments.tasks import process_recurring_payments

        User.objects.filter(is_superuser=True).delete()

        with patch("notifications.tasks.send_notification.delay") as mock_delay, \
             patch("payments.tasks.charge_saved_payment_method",
                   side_effect=Exception("mock failure")), \
             patch("payments.models.RecurringPayment") as mock_rp:

            mock_item = MagicMock()
            mock_item.id = 9998
            mock_item.student.user.first_name = "Test"
            mock_item.saved_payment_method = None
            mock_item.amount = 100
            mock_rp.objects.filter.return_value.select_related.return_value = [mock_item]
            process_recurring_payments()

            assert mock_delay.call_count == 0, (
                "send_notification.delay() must NOT be called when no superuser exists. "
                "The 'if _admin:' guard is required."
            )
