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
import { useRegistrationForm } from '../hooks/use-registration-form';
import {
  registerLandlordSchema,
  type RegisterLandlordFormData,
} from '@/lib/validations/auth.schema';

export function LandlordRegisterForm() {
  const {
    form: {
      register,
      formState: { errors },
      setFocus,
    },
    onSubmit,
    apiMessage,
    isSubmitting,
  } = useRegistrationForm<RegisterLandlordFormData>({
    schema: registerLandlordSchema,
    defaultValues: {
      role: 'landlord',
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      company_name: '',
      national_id: '',
      bank_name: '',
      bank_account_number: '',
      kra_pin: '',
      password: '',
      confirm_password: '',
      agree_to_terms: false,
    },
    role: 'landlord',
  });

  useEffect(() => {
    if (errors.first_name) setFocus('first_name');
    else if (errors.email) setFocus('email');
    else if (errors.password) setFocus('password');
  }, [errors, setFocus]);

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
          error={errors.phone_number?.message}
          required
          {...register('phone_number')}
        />

        <FormField
          label="Business name"
          placeholder="Your property business"
          error={errors.company_name?.message}
          required
          {...register('company_name')}
        />

        <FormField
          label="National ID"
          placeholder="12345678"
          error={errors.national_id?.message}
          hint="Required for landlord verification"
          required
          {...register('national_id')}
        />

        <FormField
          label="Bank name"
          placeholder="Equity Bank"
          error={errors.bank_name?.message}
          required
          {...register('bank_name')}
        />

        <FormField
          label="Bank account number"
          placeholder="0123456789"
          error={errors.bank_account_number?.message}
          hint="Used for payouts"
          required
          {...register('bank_account_number')}
        />

        <FormField
          label="KRA PIN (optional)"
          placeholder="A123456789B"
          error={errors.kra_pin?.message}
          {...register('kra_pin')}
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
          error={errors.confirm_password?.message}
          required
          {...register('confirm_password')}
        />

        <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
          <Checkbox
            id="landlord-terms"
            disabled={isSubmitting}
            {...register('agree_to_terms')}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
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
