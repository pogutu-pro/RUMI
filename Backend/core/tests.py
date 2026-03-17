from django.test import TestCase
from rest_framework.test import APIRequestFactory
from rest_framework.exceptions import NotFound, ValidationError as DRFValidationError
from core.exceptions import custom_exception_handler


class ExceptionHandlerTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def _context(self):
        request = self.factory.get('/')
        return {'request': request, 'view': None}

    def test_404_shape(self):
        """DRF 404 must have {'detail': 'Not found.', 'code': 'not_found'} shape."""
        exc = NotFound()
        response = custom_exception_handler(exc, self._context())
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 404)
        self.assertIn('detail', response.data)
        self.assertIn('code', response.data)
        self.assertEqual(response.data['code'], 'not_found')

    def test_400_validation_shape(self):
        """DRF 400 validation error must have 'detail', 'code', and 'errors' keys."""
        exc = DRFValidationError({'email': ['This field is required.']})
        response = custom_exception_handler(exc, self._context())
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 400)
        self.assertIn('detail', response.data)
        self.assertIn('code', response.data)
        # Field-level errors preserved in 'errors' key
        self.assertIn('errors', response.data)

    def test_500_shape(self):
        """Unhandled exception must return 500 with safe detail message."""
        exc = ValueError("deliberate error")
        response = custom_exception_handler(exc, self._context())
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data.get('detail'), 'An unexpected error occurred.')
