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
import { OAuthDivider } from './oauth-divider';
import { useLogin } from '../hooks/use-auth';
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
      setStep('password');
    }
  };

  const onSubmit = (data: LoginFormData) => {
    setServerError(null);
    login(data, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (err: any) => {
        let msg = 'Unable to sign in. Please check your credentials and try again.';
        
        if (err?.statusCode === 401) {
          msg = 'The email or password you entered is incorrect. Please try again.';
        } else if (err?.statusCode === 403) {
          msg = 'Your account might be restricted or you lack permissions. Please contact support.';
        } else if (err?.statusCode === 429) {
          msg = 'Too many attempts. Please wait a moment before trying again.';
        } else if (err?.message && err.message !== 'An error occurred') {
          msg = err.message;
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
          <FormField
            label="Email"
            type="email"
            placeholder="Email address"
            autoComplete="email"
            error={errors.email?.message}
            required
            className="h-14 text-lg"
            aria-invalid={!!errors.email}
            {...register('email')}
          />

          <Button
            type="button"
            onClick={handleContinue}
            className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
          >
            Continue
          </Button>

          <OAuthDivider />

          <GoogleAuthButton
            mode="login"
            onSuccess={() => onSuccess?.()}
            onError={(err) => setServerError(err?.message)}
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
    </div>
  );
}

LoginForm.displayName = 'LoginForm';
