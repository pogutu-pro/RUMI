'use client';

import React from 'react';
import { useGoogleLogin as useReactGoogleLogin } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleLogin } from '../hooks/use-auth';

interface GoogleAuthButtonProps {
  mode: 'login' | 'register';
  onSuccess?: (userData: any) => void;
  onError?: (error: any) => void;
  skipRoleSelection?: boolean; // For existing users
}

export function GoogleAuthButton({ mode, onSuccess, onError, skipRoleSelection = false }: GoogleAuthButtonProps) {
  const { mutate: googleLogin, isPending } = useGoogleLogin();

  const login = useReactGoogleLogin({
    onSuccess: async (codeResponse) => {
      if (skipRoleSelection) {
        // For existing users, complete login directly
        googleLogin({ token: codeResponse.access_token, role: 'student' }, {
          onSuccess: (response) => onSuccess?.(response),
          onError: (err) => onError?.(err),
        });
      } else {
        // For new users, get user info first for role selection
        try {
          const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${codeResponse.access_token}` }
          });
          const userInfo = await response.json();
          
          // Call onSuccess with Google user data for role selection
          onSuccess?.({
            userInfo,
            accessToken: codeResponse.access_token
          });
        } catch (error) {
          onError?.(error);
        }
      }
    },
    onError: (errorResponse) => {
      console.error('Google Login Failed:', errorResponse);
      onError?.(new Error('Google login failed'));
    },
    flow: 'implicit', // Use implicit flow for simplicity, or 'auth-code' for production
  });

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-12 text-base font-black border-2 border-primary/20 hover:bg-primary/5 hover:border-primary text-gray-900 relative rounded-none uppercase tracking-widest transition-all group active:scale-[0.98]"
      onClick={() => login()}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
      ) : (
        <svg
          className="h-5 w-5 absolute left-4 transition-all"
          aria-hidden="true"
          viewBox="0 0 24 24"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      <span className="flex-1 text-center">
        {mode === 'login' ? 'Continue' : 'Sign up'} with Google
      </span>
    </Button>
  );
}

GoogleAuthButton.displayName = 'GoogleAuthButton';
