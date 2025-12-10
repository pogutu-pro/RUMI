'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField, PasswordField } from '@/components/ui/form-fields';
import { useRegisterLandlord } from '@/hooks/use-auth';
import {
  registerLandlordSchema,
  type RegisterLandlordFormData,
} from '@/lib/validations/auth.schema';
import { mapApiMessage } from '@/lib/api/error-mapping';

export function LandlordRegisterForm() {
  const registerMutation = useRegisterLandlord();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setFocus,
  } = useForm<RegisterLandlordFormData>({
    resolver: zodResolver(registerLandlordSchema),
    defaultValues: {
      role: 'landlord',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      businessName: '',
      nationalId: '',
      bankName: '',
      bankAccountNumber: '',
      kraPin: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
    mode: 'onTouched',
  });

  const submitting = isSubmitting || registerMutation.isPending;

  const apiMessage = useMemo(
    () => mapApiMessage(registerMutation.error),
    [registerMutation.error],
  );

  useEffect(() => {
    if (errors.firstName) setFocus('firstName');
    else if (errors.email) setFocus('email');
    else if (errors.password) setFocus('password');
  }, [errors, setFocus]);

  const normalizePhone = (value?: string) =>
    value ? value.replace(/[^\d+]/g, '') : '';

  const onSubmit = handleSubmit(async (data) => {
    const payload = { ...data, phone: normalizePhone(data.phone) };
    try {
      await registerMutation.mutateAsync(payload);
    } catch (err: any) {
      if (err?.errors && typeof err.errors === 'object') {
        let focused = false;
        for (const [field, msgs] of Object.entries(err.errors)) {
          const message = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
          try {
            setError(field as keyof RegisterLandlordFormData, {
              type: 'server',
              message,
            });
            if (!focused) {
              setFocus(field as keyof RegisterLandlordFormData);
              focused = true;
            }
          } catch {
            // ignore unknown fields
          }
        }
      }
    }
  });

  return (
    <section className="space-y-6">
      {apiMessage && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertDescription>{apiMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="First name"
            placeholder="John"
            autoComplete="given-name"
            error={errors.firstName?.message}
            required
            {...register('firstName')}
          />
          <FormField
            label="Last name"
            placeholder="Doe"
            autoComplete="family-name"
            error={errors.lastName?.message}
            required
            {...register('lastName')}
          />
        </div>

        <FormField
          label="Email"
          type="email"
          placeholder="landlord@example.com"
          autoComplete="email"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <FormField
          label="Phone"
          type="tel"
          placeholder="+254712345678"
          autoComplete="tel"
          error={errors.phone?.message}
          required
          {...register('phone')}
        />

        <FormField
          label="Business name"
          placeholder="Your property business"
          error={errors.businessName?.message}
          required
          {...register('businessName')}
        />

        <FormField
          label="National ID"
          placeholder="12345678"
          error={errors.nationalId?.message}
          hint="Required for landlord verification"
          required
          {...register('nationalId')}
        />

        <FormField
          label="Bank name"
          placeholder="Equity Bank"
          error={errors.bankName?.message}
          required
          {...register('bankName')}
        />

        <FormField
          label="Bank account number"
          placeholder="0123456789"
          error={errors.bankAccountNumber?.message}
          hint="Used for payouts"
          required
          {...register('bankAccountNumber')}
        />

        <FormField
          label="KRA PIN (optional)"
          placeholder="A123456789B"
          error={errors.kraPin?.message}
          {...register('kraPin')}
        />

        <PasswordField
          label="Password"
          placeholder="Create a strong password"
          autoComplete="new-password"
          error={errors.password?.message}
          showStrength
          required
          {...register('password')}
        />

        <PasswordField
          label="Confirm password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
          <Checkbox
            id="landlord-terms"
            disabled={submitting}
            {...register('agreeToTerms')}
          />
          <label
            htmlFor="landlord-terms"
            className="text-sm text-gray-700 leading-relaxed"
          >
            I agree to the{' '}
            <Link
              href="/terms"
              className="text-emerald-600 underline-offset-2 hover:underline"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="text-emerald-600 underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Creating landlord account...
            </>
          ) : (
            <>
              <Building2 className="mr-2 h-5 w-5" aria-hidden />
              Create landlord account
            </>
          )}
        </Button>
      </form>
    </section>
  );
}
