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
  type RegisterLandlordFormData,
  registerLandlordSchema,
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
      total_units: 0,
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
        <Alert variant="destructive" role="alert" className="rounded-none border-2">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertDescription className="font-bold">{apiMessage}</AlertDescription>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Property name"
            placeholder="Sunshine Residency"
            error={errors.company_name?.message}
            required
            {...register('company_name')}
          />

          <FormField
            label="Number of units (Optional)"
            type="number"
            placeholder="20"
            error={errors.total_units?.message}
            {...register('total_units', { valueAsNumber: true })}
          />
        </div>

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

        <div className="text-xs text-center text-gray-500 font-bold uppercase tracking-wider">
          By selecting <strong>Create landlord account</strong>, I agree to the{' '}
          <Link
            href="/terms"
            className="text-primary hover:underline underline-offset-4"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="text-primary hover:underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          .
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-black bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest shadow-md active:translate-y-0.5 transition-all"
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
