"""Which social platforms can be linked, and what a valid link for each looks like."""

from urllib.parse import urlparse

from .registry import SettingError

# platform id -> (label, hostnames a profile link may use)
PLATFORMS = {
    'facebook': ('Facebook', ('facebook.com', 'fb.com', 'fb.me')),
    'instagram': ('Instagram', ('instagram.com',)),
    'x': ('X (Twitter)', ('x.com', 'twitter.com')),
    'tiktok': ('TikTok', ('tiktok.com',)),
    'linkedin': ('LinkedIn', ('linkedin.com',)),
    'youtube': ('YouTube', ('youtube.com', 'youtu.be')),
    'whatsapp': ('WhatsApp', ('wa.me', 'whatsapp.com')),
}


def validate_link(platform: str, raw) -> str:
    """Return a clean https URL for `platform` or raise SettingError."""
    if platform not in PLATFORMS:
        raise SettingError('Unknown platform.')
    label, hosts = PLATFORMS[platform]
    url = str(raw or '').strip()
    if not url:
        raise SettingError('Paste the link to your profile.')
    if len(url) > 300 or any(ch in url for ch in ' \n\r\t<>"\''):
        raise SettingError('That does not look like a valid link.')
    if '://' not in url:
        url = f'https://{url}'

    parsed = urlparse(url)
    if parsed.scheme != 'https':
        raise SettingError('The link must start with https://')
    host = (parsed.hostname or '').lower()
    if host.startswith('www.'):
        host = host[4:]
    if host.startswith('m.'):
        host = host[2:]
    if not any(host == h or host.endswith('.' + h) for h in hosts):
        raise SettingError(f'This does not look like a {label} link (expected {hosts[0]}).')
    if parsed.username or parsed.password:
        raise SettingError('That does not look like a valid link.')
    return url
