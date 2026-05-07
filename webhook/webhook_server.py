#!/usr/bin/env python3
import hashlib
import hmac
import json
import logging
import os
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)
logger = logging.getLogger(__name__)

WEBHOOK_SECRET = os.environ.get('GITHUB_WEBHOOK_SECRET', '').encode()
DEPLOY_SCRIPT = os.environ.get('DEPLOY_SCRIPT', '/opt/rumi/deploy.sh')
DEPLOY_BRANCH = os.environ.get('DEPLOY_BRANCH', 'refs/heads/main')
PORT = int(os.environ.get('WEBHOOK_PORT', '9000'))


class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        if WEBHOOK_SECRET:
            sig_header = self.headers.get('X-Hub-Signature-256', '')
            expected = 'sha256=' + hmac.new(WEBHOOK_SECRET, body, hashlib.sha256).hexdigest()
            if not hmac.compare_digest(sig_header, expected):
                logger.warning('Invalid webhook signature from %s', self.client_address)
                self._respond(403, 'Forbidden')
                return

        event = self.headers.get('X-GitHub-Event', '')
        logger.info('Received GitHub event: %s', event)

        if event == 'push':
            try:
                payload = json.loads(body)
            except json.JSONDecodeError:
                self._respond(400, 'Bad Request')
                return

            ref = payload.get('ref', '')
            if ref == DEPLOY_BRANCH:
                logger.info('Push to %s detected — triggering deploy', ref)
                subprocess.Popen(
                    ['bash', DEPLOY_SCRIPT],
                    stdout=open('/var/log/rumi-deploy.log', 'a'),
                    stderr=subprocess.STDOUT
                )
                self._respond(200, 'Deploy triggered')
                return
            else:
                logger.info('Push to %s ignored (not %s)', ref, DEPLOY_BRANCH)

        self._respond(200, 'OK')

    def _respond(self, code, message):
        self.send_response(code)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(message.encode())

    def log_message(self, format, *args):
        logger.info('%s - %s', self.address_string(), format % args)


if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', PORT), WebhookHandler)
    logger.info('Webhook server listening on port %d', PORT)
    server.serve_forever()
