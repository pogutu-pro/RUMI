"""
Custom JWT Authentication that also checks cookies
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken, AuthenticationFailed
from django.contrib.auth import get_user_model

User = get_user_model()


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that checks both Authorization header and cookies.
    Returns None for missing/invalid tokens to allow AllowAny permissions.
    """
    
    def authenticate(self, request):
        # Try Authorization header first (but catch exceptions)
        try:
            header = self.get_header(request)
            if header is not None:
                raw_token = self.get_raw_token(header)
                if raw_token is not None:
                    validated_token = self.get_validated_token(raw_token)
                    return self.get_user(validated_token), validated_token
        except (InvalidToken, TokenError, AuthenticationFailed):
            # Invalid token in header, continue to check cookies
            pass
        
        # If no valid token in header, try cookies
        raw_token = request.COOKIES.get('rumi_access_token')
        
        if raw_token is None:
            return None  # No token at all - allow anonymous access
        
        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            return user, validated_token
        except (TokenError, InvalidToken, AuthenticationFailed):
            # Invalid/expired token in cookie - allow anonymous access
            # This is critical: returning None allows AllowAny permission classes to work
            return None