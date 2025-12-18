"""
Custom JWT Authentication that also checks cookies
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that checks both Authorization header and cookies
    """
    
    def authenticate(self, request):
        # First, try the standard JWT authentication (Authorization header)
        auth_result = super().authenticate(request)
        if auth_result is not None:
            return auth_result
        
        # If no Authorization header, try to get token from cookies
        raw_token = request.COOKIES.get('rumi_access_token')
        
        if raw_token is None:
            return None
        
        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            return user, validated_token
        except TokenError as e:
            raise InvalidToken(_('Token given is invalid or expired')) from e