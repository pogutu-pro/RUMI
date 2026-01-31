'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2, AlertCircle, ChevronLeft } from 'lucide-react';

import { FormField, PasswordField } from '@/components/ui/form-fields';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleAuthButton } from './google-auth-button';
import { OAuthDivider } from './oauth-divider';
import { useLogin, useCheckEmail } from '../hooks/use-auth';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth.schema';
import { cn } from '@/lib/utils/cn';
import { AUTH_ROUTES } from '@/lib/constants/routes';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
}

type Step = 'email' | 'password' | 'google-required';

interface EmailCheckResult {
  exists: boolean;
  auth_method: 'google' | 'email';
  role?: string;
  message: string;
  supports_password?: boolean;
}

export function LoginForm({ onSuccess, onError, className }: LoginFormProps) {
  const [step, setStep] = useState<Step>('email');
  const [emailValue, setEmailValue] = useState('');
  const [emailCheckResult, setEmailCheckResult] = useState<EmailCheckResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { mutate: login, isPending } = useLogin();
  const { mutate: checkEmail, isPending: isCheckingEmail } = useCheckEmail();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onTouched',
  });

  const handleGoogleSuccess = () => {
    // For existing Google users, this will auto-login
    // For new Google users, they'll be redirected to registration
    onSuccess?.();
  };

  const handleGoogleError = (err: any) => {
    setServerError(err?.message || 'Google sign in failed. Please try again.');
  };

  const handleBackToEmail = () => {
    setStep('email');
    setEmailCheckResult(null);
    setServerError(null);
  };
      
  const handleContinue = async () => {
    const isEmailValid = await trigger('email');
    if (isEmailValid) {
      // Check email and authentication method
      checkEmail(emailValue, {
        onSuccess: (result: EmailCheckResult) => {
          setEmailCheckResult(result);
          
          if (!result.exists) {
            // New user - go to registration
            window.location.href = `${AUTH_ROUTES.REGISTER}?email=${encodeURIComponent(emailValue)}`;
          } else if (result.auth_method === 'google') {
            // Existing Google user - show Google required screen
            setStep('google-required');
          } else {
            // Regular email user - go to password step
            setStep('password');
          }
        },
        onError: (err: any) => {
          // If check fails, default to password flow
          setStep('password');
        }
      });
    }
  };

  const onSubmit = (data: LoginFormData) => {
    setServerError(null);
    login(data, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (err: any) => {
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Login failed. Please check your credentials.';
        setServerError(message);
        onError?.(err);
      },
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {serverError && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {step === 'email' && (
        <div className="space-y-4">
          <div className="text-center mb-8 border-b-2 border-primary/10 pb-4">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Identity Check</h2>
          </div>

          <FormField
            label="Email"
            type="email"
            placeholder="enter your email"
            autoComplete="email"
            error={errors.email?.message}
            required
            className="h-12 text-base rounded-none border-2 focus:border-primary"
            aria-invalid={!!errors.email}
            {...registerField('email')}
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
          />

          <Button
            type="button"
            onClick={handleContinue}
            className="w-full h-12 text-base font-black bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest"
            disabled={isCheckingEmail}
          >
            {isCheckingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Processing...
              </>
            ) : (
              'Continue'
            )}
          </Button>

          <OAuthDivider />

          <GoogleAuthButton
            mode="login"
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
          
          <div className="text-center mt-6 pt-4 border-t-2 border-primary/10">
             <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">New to Rumi? </span>
             <Link href={AUTH_ROUTES.REGISTER} className="text-sm font-black text-primary hover:underline underline-offset-4 uppercase tracking-widest">
               Create Account
             </Link>
          </div>
        </div>
      )}

      {step === 'password' && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <div className="flex items-center mb-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="p-0 hover:bg-transparent"
              onClick={() => setStep('email')}
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </Button>
            <div className="flex-1 text-center pr-8">
              <span className="text-sm text-gray-500">{emailValue}</span>
            </div>
          </div>

          <PasswordField
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            required
            {...registerField('password')}
          />

          <div className="flex items-center justify-between">
            <Link 
              href="/forgot-password" 
              className="text-xs font-black text-primary uppercase tracking-widest hover:underline underline-offset-4"
            >
              Reset Password
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-black bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      )}

      {step === 'google-required' && emailCheckResult && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Google Account Required
            </h3>
            <p className="text-gray-600 mb-4">
              This account was created using Google Sign-In. Please continue with Google to access your account.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Account:</strong> {emailValue}<br/>
                <strong>Role:</strong> {emailCheckResult.role}<br/>
                <strong>Method:</strong> Google Authentication
              </p>
            </div>
          </div>

          <GoogleAuthButton
            mode="login"
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            skipRoleSelection={true}
          />

          <Button
            variant="ghost"
            className="w-full"
            onClick={handleBackToEmail}
          >
            Back to sign in options
          </Button>
        </div>
      )}
    </div>
  );
}
