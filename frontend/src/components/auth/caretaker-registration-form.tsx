'use client';

import { useEffect, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserCog, Info, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField, PasswordField } from '@/components/ui/form-fields';
import { useRegisterCaretaker } from '@/hooks/use-auth';
import {
  registerCaretakerSchema,
  type RegisterCaretakerFormData,
} from '@/lib/validations/auth.schema';
import { mapApiMessage } from '@/lib/api/error-mapping';

export function CaretakerRegistrationForm() {
  const registerMutation = useRegisterCaretaker();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setFocus,
  } = useForm<RegisterCaretakerFormData>({
    resolver: zodResolver(
      registerCaretakerSchema,
    ) as Resolver<RegisterCaretakerFormData>,
    defaultValues: {
      role: 'caretaker',
      hostelId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      employmentStartDate: undefined,
      nationalId: '',
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
    if (errors.hostelId) setFocus('hostelId');
    else if (errors.firstName) setFocus('firstName');
    else if (errors.email) setFocus('email');
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
            setError(field as keyof RegisterCaretakerFormData, {
              type: 'server',
              message,
            });
            if (!focused) {
              setFocus(field as keyof RegisterCaretakerFormData);
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
      <Alert role="status">
        <Info className="h-4 w-4" aria-hidden />
        <AlertDescription className="text-sm">
          Caretaker accounts must be invited by a verified landlord. Request a
          hostel ID or invitation code from your employer.
        </AlertDescription>
      </Alert>

      {apiMessage && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertDescription>{apiMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormField
          label="Hostel ID / Invitation code"
          placeholder="RUMI-HST-0001"
          error={errors.hostelId?.message}
          required
          {...register('hostelId')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="First name"
            placeholder="Jane"
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
          placeholder="caretaker@hostel.com"
          autoComplete="email"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <FormField
          label="Phone number"
          type="tel"
          placeholder="+254712345678"
          autoComplete="tel"
          error={errors.phone?.message}
          required
          {...register('phone')}
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
          placeholder="Re-enter password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
          <Checkbox
            id="caretaker-terms"
            disabled={submitting}
            {...register('agreeToTerms')}
          />
          <label
            htmlFor="caretaker-terms"
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
          className="w-full h-11 font-semibold"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Creating caretaker account...
            </>
          ) : (
            <>
              <UserCog className="mr-2 h-5 w-5" aria-hidden />
              Create caretaker account
            </>
          )}
        </Button>
      </form>
    </section>
  );
}
