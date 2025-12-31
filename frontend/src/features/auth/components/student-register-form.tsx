'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField, PasswordField } from '@/components/ui/form-fields';
import { useRegistrationForm } from '../hooks/use-registration-form';
import {
  registerStudentSchema,
  type RegisterStudentFormData,
} from '@/lib/validations/auth.schema';
import { mapApiMessage } from '@/lib/api/error-mapping';

export function StudentRegisterForm() {
  const {
    form: {
      register,
      formState: { errors },
      setFocus,
    },
    onSubmit,
    apiMessage,
    isSubmitting,
  } = useRegistrationForm<RegisterStudentFormData>({
    schema: registerStudentSchema,
    defaultValues: {
      role: 'student',
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      password: '',
      confirm_password: '',
      university: '',
      student_id_number: '',
      year_of_study: 1,
      course: '',
      agree_to_terms: false,
    },
    role: 'student',
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
          <AlertDescription>{apiMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
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
          label="University email"
          type="email"
          placeholder="you@university.ac.ke"
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

        <FormField
          label="University"
          placeholder="University of Nairobi"
          error={errors.university?.message}
          required
          {...register('university')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Student ID"
            placeholder="STU/2025/001"
            error={errors.student_id_number?.message}
            required
            {...register('student_id_number')}
          />

          <FormField
            label="Year of study"
            type="number"
            min={1}
            max={7}
            placeholder="3"
            error={errors.year_of_study?.message}
            required
            {...register('year_of_study', { valueAsNumber: true })}
          />
        </div>

        <PasswordField
          label="Password"
          placeholder="Create a strong password"
          autoComplete="new-password"
          error={errors.password?.message}
          required
          showStrength
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
            id="student-terms"
            disabled={isSubmitting}
            {...register('agree_to_terms')}
          />
          <label
            htmlFor="student-terms"
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
              Creating account...
            </>
          ) : (
            'Create student account'
          )}
        </Button>
      </form>
    </section>
  );
}
