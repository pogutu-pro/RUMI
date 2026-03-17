import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Normalize all DRF error responses to a consistent shape:
      {'detail': '...', 'code': '...'}
    Field-level validation errors are preserved in an 'errors' key.
    Unhandled exceptions return HTTP 500 with a safe message (no stack trace).
    """
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception — log it, return safe 500
        view = context.get('view')
        view_name = view.__class__.__name__ if view else 'unknown view'
        logger.exception('Unhandled exception in %s', view_name)
        return Response(
            {'detail': 'An unexpected error occurred.', 'code': '500'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    data = response.data
    if isinstance(data, dict):
        # Extract detail string
        detail = data.get('detail', '')

        # Extract code from DRF exception detail attribute
        exc_detail = getattr(exc, 'detail', None)
        code = getattr(exc_detail, 'code', None)
        if code is None and isinstance(exc_detail, dict):
            # ValidationError with field-level dict — use status code as fallback
            code = str(response.status_code)
        if code is None:
            code = str(response.status_code)

        # Field-level errors are any keys other than 'detail'
        errors = {k: v for k, v in data.items() if k != 'detail'}

        normalized = {'detail': str(detail) if detail else '', 'code': str(code)}
        if errors:
            normalized['errors'] = errors

        response.data = normalized

    return response
