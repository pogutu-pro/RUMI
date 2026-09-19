from django.core.mail.backends.smtp import EmailBackend as SMTPEmailBackend

from .delivery_log import log_delivery


class LoggingSMTPEmailBackend(SMTPEmailBackend):
    """
    SMTP backend that records every message's outcome in the delivery log, so
    the admin Notifications page reflects all email regardless of which
    feature sent it.
    """

    def send_messages(self, email_messages):
        sent_total = 0
        for message in email_messages:
            try:
                sent = super().send_messages([message]) or 0
            except Exception as exc:
                self._log(message, ok=False, error=exc)
                if not self.fail_silently:
                    raise
                continue
            self._log(message, ok=bool(sent), error='' if sent else 'SMTP server accepted no recipients')
            sent_total += sent
        return sent_total

    @staticmethod
    def _log(message, *, ok, error):
        for address in message.to or []:
            log_delivery(channel='email', address=address, subject=message.subject, ok=ok, error=error)
