'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, CheckCircle2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthCard } from '@/features/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OTPInput } from '@/components/ui/otp-input';
import { useVerifyEmail, useResendVerification, type ResendOtpRequest } from '@/features/auth';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import {
  verifyEmailSchema,
  type VerifyEmailFormData,
} from '@/lib/validations/auth.schema';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams?.get('email') ?? '';
  const tokenFromQuery = searchParams?.get('token') ?? '';

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
    getValues,
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { otp: '', email: emailFromQuery },
    mode: 'onSubmit',
  });

  const [resendCooldown, setResendCooldown] = React.useState<number>(0);
  const verifyHook = useVerifyEmail();
  const resendHook = useResendVerification();

  const loading = verifyHook.isPending || resendHook.isPending;

  // Verifying returns the user to sign in — they are not logged in yet.
  React.useEffect(() => {
    if (!verifyHook.isSuccess) return;
    const id = window.setTimeout(() => router.push(AUTH_ROUTES.LOGIN as Route), 2000);
    return () => window.clearTimeout(id);
  }, [verifyHook.isSuccess, router]);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setInterval(
      () => setResendCooldown((prev) => Math.max(0, prev - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [resendCooldown]);

  const onSubmit = (data: VerifyEmailFormData) => {
    verifyHook.mutate({
      ...data,
      email: data.email || emailFromQuery,
      token: tokenFromQuery,
    });
  };

  // Submit the moment the sixth digit lands (typed or pasted) instead of
  // making the user find the button. A wrong code is cleared so they can
  // retype straight away; without an email there is nothing to check against,
  // so the manual button and email field remain.
  const handleComplete = (code: string) => {
    const email = getValues('email') || emailFromQuery;
    if (!email || verifyHook.isPending) return;
    verifyHook.mutate(
      { otp: code, email, token: tokenFromQuery },
      { onError: () => setValue('otp', '') },
    );
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendHook.isPending) return;
    try {
      const payload: ResendOtpRequest = { email: getValues('email') || emailFromQuery };
      await resendHook.mutateAsync(payload);
      setResendCooldown(60);
      clearErrors('otp');
      setValue('otp', '');
    } catch (err: any) {
      const msg = err?.message ?? 'Unable to resend code';
      setError('otp', { message: msg });
    }
  };

  if (verifyHook.isSuccess) {
    return (
      <section className="mx-auto w-full max-w-md">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <header className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Email verified!
            </h1>
            <p className="text-gray-600">
              Your email has been verified. Taking you to sign in…
            </p>
          </header>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-green-600 h-full rounded-full transition-all duration-1500 ease-in-out w-full" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <AuthCard
      title="Verify your email"
      description="We've sent a 6-digit code to your email"
      icon={<Mail className="w-8 h-8 text-gray-600" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Verification code sent to{' '}
            <strong>{emailFromQuery || 'your email'}</strong>
          </AlertDescription>
        </Alert>

        {!emailFromQuery && (
          <div className="space-y-1.5">
            <label htmlFor="verify-email-address" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  id="verify-email-address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11"
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 text-center">
            Enter verification code
          </label>

          <Controller
            control={control}
            name="otp"
            render={({ field }) => (
              <OTPInput
                length={6}
                autoFocus
                onComplete={handleComplete}
                value={field.value}
                onChange={(value: string) => {
                  field.onChange(value);
                  if (errors.otp) clearErrors('otp');
                }}
                disabled={loading}
                error={!!errors.otp}
              />
            )}
          />

          {errors.otp && (
            <p className="text-sm text-red-600 text-center">
              {errors.otp.message}
            </p>
          )}
        </div>

        <div className="bg-muted/50 border border-border rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            The code will expire in{' '}
            <span className="font-semibold">5 minutes</span>
          </p>
        </div>

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify email'
          )}
        </Button>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">Didn&apos;t receive the code?</p>
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            disabled={loading || resendCooldown > 0}
            className="text-primary hover:text-primary/80 hover:bg-primary/5"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend code'}
          </Button>
        </div>

        <div className="pt-4 border-t text-center">
          <Link
            href={AUTH_ROUTES.LOGIN}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to login
          </Link>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500">
        Your verification code is secure and one-time use
      </p>
    </AuthCard>
  );
}
