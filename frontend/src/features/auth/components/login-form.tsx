'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2, AlertCircle, ChevronLeft } from 'lucide-react';

import { FormField, PasswordField } from '@/components/ui/form-fields';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

type Step = 'email' | 'password';

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

  const handleContinue = async () => {
    const isEmailValid = await trigger('email');
    if (isEmailValid) {
      setServerError(null);
      checkEmail(emailValue, {
        onSuccess: () => setStep('password'),
        onError: () => setStep('password'),
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

          {showRegisterLink && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href={AUTH_ROUTES.REGISTER}
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
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
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg"
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

    </div>
  );
}

LoginForm.displayName = 'LoginForm';
