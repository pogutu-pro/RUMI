'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Smartphone, CheckCircle2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AuthCard } from '@/features/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OTPInput } from '@/components/ui/otp-input';
import { useVerifyPhone, useResendVerification } from '@/features/auth';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import {
  verifyPhoneSchema,
  type VerifyPhoneFormData,
} from '@/lib/validations/auth.schema';

export default function VerifyPhonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneFromQuery = searchParams?.get('phone') ?? '';

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useForm<VerifyPhoneFormData>({
    resolver: zodResolver(verifyPhoneSchema),
    defaultValues: { otp: '', phone: phoneFromQuery },
    mode: 'onSubmit',
  });

  const redirectTimerRef = React.useRef<number | null>(null);
  const [resendCooldown, setResendCooldown] = React.useState<number>(0);
  const [watchedOtp, setWatchedOtp] = React.useState<string>('');
  const verifyHook = useVerifyPhone();
  const resendHook = useResendVerification();

  const loading = verifyHook.isPending || resendHook.isPending;

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setInterval(
      () => setResendCooldown((prev) => Math.max(0, prev - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [resendCooldown]);

  const submitOtp = React.useCallback(
    async (data: VerifyPhoneFormData) => {
      clearErrors('otp');
      try {
        const payload = { phone: data.phone ?? phoneFromQuery, otp: data.otp };

        if (typeof verifyHook?.mutateAsync === 'function') {
          await verifyHook.mutateAsync(payload as any);
        } else {
          await new Promise<void>((resolve, reject) =>
            verifyHook.mutate(payload as any, {
              onSuccess: resolve,
              onError: reject,
            }),
          );
        }

        setTimeout(() => router.push('/dashboard' as Route), 1800);
      } catch (err: any) {
        const msg = err?.message ?? 'Invalid verification code';
        setError('otp', { message: msg });
        setValue('otp', '');
      }
    },
    [verifyHook, phoneFromQuery, router, clearErrors, setError, setValue],
  );

  async function handleResend() {
    if (resendCooldown > 0 || resendHook?.isPending) return;

    try {
      const payload = { phone: phoneFromQuery };
      if (typeof resendHook?.mutateAsync === 'function') {
        await resendHook.mutateAsync(payload as any);
      } else {
        await new Promise<void>((resolve, reject) =>
          resendHook.mutate(payload as any, {
            onSuccess: resolve,
            onError: reject,
          }),
        );
      }
      setResendCooldown(60);
      clearErrors('otp');
      setValue('otp', '');
    } catch (err: any) {
      const msg = err?.message ?? 'Unable to resend code';
      setError('otp', { message: msg });
    }
  }

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/(\+254|0)(\d{2})(\d{4})(\d{4})/, '$1$2****$4');
  };

  if (verifyHook?.isSuccess) {
    return (
      <section className="mx-auto w-full max-w-md">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Phone verified</h1>
            <p className="text-gray-600">
              You&apos;re all set. Redirecting to your dashboard.
            </p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-600 h-full rounded-full"
              style={{
                width: '100%',
                animation: 'progress 1.8s ease-in-out forwards',
              }}
            />
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
              @keyframes progress {
                from { width: 0%; }
                to { width: 100%; }
              }
            `,
            }}
          />
        </div>
      </section>
    );
  }

  return (
    <AuthCard
      title="Verify your phone"
      description="We've sent a 6-digit code to your phone"
    >
      <form onSubmit={handleSubmit(submitOtp)} className="space-y-6" noValidate>
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription className="text-sm">
            SMS verification code sent to{' '}
            <strong>{maskPhone(phoneFromQuery)}</strong>
          </AlertDescription>
        </Alert>

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
                value={field.value}
                onChange={(v: string) => {
                  field.onChange(v);
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

        <div className="bg-muted/50 border border-border rounded-xl p-4 text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            Expires in <span className="font-semibold">5 minutes</span>
          </p>
          <p className="text-xs text-muted-foreground">Standard SMS rates may apply</p>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold"
          disabled={loading}
        >
          {loading || verifyHook?.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify phone number'
          )}
        </Button>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">Didn&apos;t receive the code?</p>
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            disabled={loading || resendCooldown > 0 || resendHook?.isPending}
            className="text-primary hover:text-primary/80 hover:bg-primary/5"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend SMS code'}
          </Button>
        </div>

        <div className="pt-4 border-t text-center">
          <Link
            href={AUTH_ROUTES.LOGIN}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Use a different phone number
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
