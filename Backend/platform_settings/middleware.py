from . import service


class PlatformSettingsMiddleware:
    """Pick up dashboard changes made by another process before handling a request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        service.ensure_fresh()
        return self.get_response(request)
