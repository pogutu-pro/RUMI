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
import { useQuery } from '@tanstack/react-query';
import { hostelsApi } from '@/features/hostels/api/hostels';
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
      preferred_hostel_id: undefined,
      room_number: '',
      gender: 'male',
      date_of_birth: '',
      agree_to_terms: false,
    },
    role: 'student',
  });

  useEffect(() => {
    if (errors.first_name) setFocus('first_name');
    else if (errors.email) setFocus('email');
    else if (errors.password) setFocus('password');
  }, [errors, setFocus]);

  const { data: hostelsData } = useQuery({
    queryKey: ['hostels_list_minimal'],
    queryFn: () => hostelsApi.getHostels({ per_page: 100 }),
  });
  const hostels = hostelsData?.results || [];

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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              Gender <span className="text-destructive">*</span>
            </label>
            <select
              {...register('gender')}
              className="flex h-11 w-full rounded-none border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && (
              <p className="text-sm text-destructive">{errors.gender.message}</p>
            )}
          </div>

          <FormField
            label="Date of Birth"
            type="date"
            error={errors.date_of_birth?.message}
            required
            {...register('date_of_birth')}
          />
        </div>

        <FormField
          label="School (University)"
          placeholder="University of Nairobi"
          error={errors.university?.message}
          required
          {...register('university')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Hostel (Optional)
            </label>
            <select
              {...register('preferred_hostel_id')}
              className="flex h-11 w-full rounded-none border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <option value="">I haven't picked one yet</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <FormField
            label="Room Number (Optional)"
            placeholder="A12"
            error={errors.room_number?.message}
            {...register('room_number')}
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

        <div className="text-xs text-center text-gray-500 font-bold uppercase tracking-wider">
          By selecting <strong>Create student account</strong>, I agree to the{' '}
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
