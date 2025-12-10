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
import { useRegisterStudent } from '@/hooks/use-auth';
import {
  registerStudentSchema,
  type RegisterStudentFormData,
} from '@/lib/validations/auth.schema';
import { mapApiMessage } from '@/lib/api/error-mapping';

export function StudentRegisterForm() {
  const registerMutation = useRegisterStudent();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setFocus,
  } = useForm<RegisterStudentFormData>({
    resolver: zodResolver(registerStudentSchema),
    defaultValues: {
      role: 'student',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      university: '',
      studentIdNumber: '',
      yearOfStudy: 1,
      course: '',
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
            setError(field as keyof RegisterStudentFormData, {
              type: 'server',
              message,
            });
            if (!focused) {
              setFocus(field as keyof RegisterStudentFormData);
              focused = true;
            }
          } catch {
            // ignore unknown field
          }
        }
      }
    }
  });

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
          error={errors.phone?.message}
          required
          {...register('phone')}
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
            error={errors.studentIdNumber?.message}
            required
            {...register('studentIdNumber')}
          />

          <FormField
            label="Year of study"
            type="number"
            min={1}
            max={7}
            placeholder="3"
            error={errors.yearOfStudy?.message}
            required
            {...register('yearOfStudy', { valueAsNumber: true })}
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
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
          <Checkbox
            id="student-terms"
            disabled={submitting}
            {...register('agreeToTerms')}
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
          disabled={submitting}
        >
          {submitting ? (
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
