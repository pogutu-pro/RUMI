'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2, AlertCircle, ChevronLeft } from 'lucide-react';

import { FormField, PasswordField } from '@/components/ui/form-fields';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleAuthButton } from './google-auth-button';
import { GoogleRoleSelection } from './google-role-selection';
import { OAuthDivider } from './oauth-divider';
import { useLogin, useCheckEmail } from '../hooks/use-auth';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth.schema';
import { cn } from '@/lib/utils/cn';
import { AUTH_ROUTES } from '@/lib/constants/routes';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
  showForgotPassword?: boolean;
  showRegisterLink?: boolean;
  redirectTo?: string;
}

type Step = 'email' | 'password' | 'google-role-selection' | 'google-required';

interface GoogleData {
  userInfo: {
    email: string;
    name: string;
    picture: string;
  };
  accessToken: string;
}

interface EmailCheckResult {
  exists: boolean;
  auth_method: 'google' | 'email';
  role?: string;
  message: string;
}

export function LoginForm({
  onSuccess,
  onError,
  className,
  showForgotPassword = true,
  showRegisterLink = true,
  redirectTo,
}: LoginFormProps) {
  const { mutate: login, isPending } = useLogin();
  const { mutate: checkEmail, isPending: isCheckingEmail } = useCheckEmail();
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('email');
  const [googleData, setGoogleData] = useState<GoogleData | null>(null);
  const [emailCheckResult, setEmailCheckResult] = useState<EmailCheckResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setFocus,
    trigger,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
    mode: 'onTouched',
  });

  const emailValue = watch('email');

  useEffect(() => {
    if (step === 'email') {
      setFocus('email');
    } else {
      setFocus('password');
    }
  }, [setFocus, step]);

  const handleGoogleSuccess = (data: GoogleData) => {
    setGoogleData(data);
    setStep('google-role-selection');
  };

  const handleGoogleError = (err: any) => {
    setServerError(err?.message || 'Google sign in failed. Please try again.');
  };

  const handleBackToEmail = () => {
    setStep('email');
    setGoogleData(null);
  };

  const handleContinue = async () => {
    const isEmailValid = await trigger('email');
    if (isEmailValid) {
      setServerError(null);
      
      // Check email and authentication method
      checkEmail(emailValue, {
        onSuccess: (result: EmailCheckResult) => {
          setEmailCheckResult(result);
          
          if (!result.exists) {
            // New user - go to password step for regular registration
            setStep('password');
          } else if (result.auth_method === 'google') {
            // Existing Google user - show choice between Google and password
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
        // 1. Identify status code from multiple possible locations
        const status = err?.statusCode || err?.status || err?.response?.status;
        
        // 2. Identify message from multiple possible locations
        const rawMessage = err?.message || err?.response?.data?.message || err?.error;

        // 3. Fallback message (Calm & Tailored)
        let msg = 'Unable to sign in. Please verify your email and password and try again.';
        
        // Use raw message only if it's NOT a technical Axios message
        const isTechnical = 
          typeof rawMessage === 'string' && 
          (rawMessage.includes('status code') || 
           rawMessage.includes('Network Error') || 
           rawMessage === 'An error occurred');

        if (rawMessage && !isTechnical) {
          msg = rawMessage;
        }
        
        // 4. Strong Overrides for calm messaging
        if (status === 401 || status === 400) {
          msg = 'The email or password you entered is incorrect. Please try again.';
        } else if (status === 403) {
          msg = 'Your account is currently restricted. Please contact support if you believe this is an error.';
        } else if (status === 429) {
          msg = 'Too many failed attempts. For your security, please wait a few minutes before trying again.';
        }

        setServerError(msg);
        onError?.(err);
      },
    });
  };

  return (
    <div className={cn('space-y-5', className)}>
      {serverError && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {step === 'email' ? (
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
            {...register('email')}
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
                Checking...
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

          {showRegisterLink && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href={AUTH_ROUTES.REGISTER}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Register
                </Link>
              </p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

          <div className="space-y-2">
            <PasswordField
              label="Password"
              placeholder="Enter your password"
              autoComplete="current-password"
              error={errors.password?.message}
              required
              aria-invalid={!!errors.password}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  {...register('rememberMe')}
                />
                <span className="text-gray-600">Remember me</span>
              </label>

              {showForgotPassword && (
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </Link>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
            disabled={isPending || !isDirty}
            aria-disabled={isPending || !isDirty}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Signing in...
              </>
            ) : (
              'Log in'
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
              Choose Your Sign-In Method
            </h3>
            <p className="text-gray-600 mb-4">
              Your account supports multiple sign-in methods. Choose what's most convenient for you.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Account:</strong> {emailValue}<br/>
                <strong>Role:</strong> {emailCheckResult.role}<br/>
                <strong>Methods:</strong> Google + Email/Password
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <GoogleAuthButton
              mode="login"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              skipRoleSelection={true}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 text-base font-semibold"
              onClick={() => setStep('password')}
            >
              Continue with Email and Password
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={handleBackToEmail}
          >
            Back to sign in options
          </Button>
        </div>
      )}

      {step === 'google-role-selection' && googleData && (
        <GoogleRoleSelection
          userInfo={googleData.userInfo}
          accessToken={googleData.accessToken}
          onBack={handleBackToEmail}
        />
      )}
    </div>
  );
}

LoginForm.displayName = 'LoginForm';
