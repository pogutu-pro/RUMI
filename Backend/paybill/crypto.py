"""
Symmetric encryption for third-party credentials stored in the database
(a landlord's Daraja consumer key/secret). Fernet (AES-128-CBC + HMAC).

Key: settings.FIELD_ENCRYPTION_KEY (a Fernet key — generate with
`python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`).
Without it, a key is derived from SECRET_KEY so development works; set a
dedicated key in production so rotating SECRET_KEY doesn't lock credentials.
"""

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


class DecryptionError(Exception):
    pass


def _fernet() -> Fernet:
    key = getattr(settings, 'FIELD_ENCRYPTION_KEY', '') or ''
    if not key:
        digest = hashlib.sha256(f'rumiarent-field-encryption:{settings.SECRET_KEY}'.encode()).digest()
        key = base64.urlsafe_b64encode(digest).decode()
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode() if value else ''


def decrypt(token: str) -> str:
    if not token:
        return ''
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken as exc:
        raise DecryptionError('Stored credential cannot be decrypted with the current key') from exc
