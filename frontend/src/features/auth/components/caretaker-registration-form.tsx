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
import { useRegistrationForm } from '../hooks/use-registration-form';
import {
  registerCaretakerSchema,
  type RegisterCaretakerFormData,
} from '@/lib/validations/auth.schema';

export function CaretakerRegistrationForm() {
  const {
    form: {
      register,
      formState: { errors },
      setFocus,
    },
    onSubmit,
    apiMessage,
    isSubmitting,
  } = useRegistrationForm<RegisterCaretakerFormData>({
    schema: registerCaretakerSchema,
    defaultValues: {
      role: 'caretaker',
      hostel_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      password: '',
      confirm_password: '',
      employment_start_date: undefined,
      national_id: '',
      agree_to_terms: false,
    },
    role: 'caretaker',
  });

  useEffect(() => {
    if (errors.hostel_id) setFocus('hostel_id');
    else if (errors.first_name) setFocus('first_name');
    else if (errors.email) setFocus('email');
  }, [errors, setFocus]);

  return (
    <section className="space-y-6">
      <Alert role="status">
        <Info className="h-4 w-4" aria-hidden />
        <AlertDescription className="text-sm">
          Caretaker accounts must be invited by a verified landlord. Ask your
          landlord to send you an invitation.
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
          label="Invitation code"
          placeholder="RUMI-HST-0001"
          error={errors.hostel_id?.message}
          required
          {...register('hostel_id')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="First name"
            placeholder="Jane"
            autoComplete="given-name"
            error={errors.first_name?.message}
            required
            {...register('first_name')}
          />
          <FormField
            label="Last name"
            placeholder="Doe"
            autoComplete="family-name"
            error={errors.last_name?.message}
            required
            {...register('last_name')}
          />
        </div>

        <FormField
          label="Email"
          type="email"
          placeholder="you@example.com"
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
          error={errors.phone_number?.message}
          required
          {...register('phone_number')}
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
          error={errors.confirm_password?.message}
          required
          {...register('confirm_password')}
        />

        <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
          <Checkbox
            id="caretaker-terms"
            disabled={isSubmitting}
            {...register('agree_to_terms')}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
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
