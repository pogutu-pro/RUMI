'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2, AlertCircle, ChevronLeft } from 'lucide-react';

import { FormField, PasswordField } from '@/components/ui/form-fields';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleAuthButton } from './google-auth-button';
import { GoogleRoleSelection } from './google-role-selection';
import { OAuthDivider } from './oauth-divider';
import { RoleSelector } from './role-selector';
import { useRegister } from '../hooks/use-auth';
import {
  registerStudentSchema,
  registerLandlordSchema,
  registerCaretakerSchema,
  type RegisterFormData,
} from '@/lib/validations/auth.schema';
import { cn } from '@/lib/utils/cn';
import { AUTH_ROUTES } from '@/lib/constants/routes';

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
}

type Step = 'email' | 'details' | 'google-role-selection';
type Role = 'student' | 'landlord' | 'caretaker';

interface GoogleData {
  userInfo: {
    email: string;
    name: string;
    picture: string;
  };
  accessToken: string;
}

export function RegisterForm({ onSuccess, onError, className }: RegisterFormProps) {
  const [step, setStep] = useState<Step>('email');
  const [role, setRole] = useState<Role>('student');
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleData, setGoogleData] = useState<GoogleData | null>(null);

  const { mutate: register, isPending } = useRegister();

  const handleGoogleSuccess = (data: GoogleData) => {
    setGoogleData(data);
    setStep('google-role-selection');
  };

  const handleGoogleError = (err: any) => {
    setServerError(err?.message || 'Google sign in failed. Please try again.');
  };

  const handleBackToEmail = () => {
    setStep('email');
    setGoogleData(null);
  };

  const schema = useMemo(() => {
    switch (role) {
      case 'student':
        return registerStudentSchema;
      case 'landlord':
        return registerLandlordSchema;
      case 'caretaker':
        return registerCaretakerSchema;
      default:
        return registerStudentSchema;
    }
  }, [role]);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      email: '',
      password: '',
      confirm_password: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      role,
      agree_to_terms: false,
    } as any,
    mode: 'onTouched',
  });

  const emailValue = watch('email');

  const handleContinue = async () => {
    const isEmailValid = await trigger('email');
    if (isEmailValid) {
      setStep('details');
    }
  };

  const onSubmit = (data: RegisterFormData) => {
    setServerError(null);
    register(data as any, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (err: any) => {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Registration failed. Please try again.';
        setServerError(message);
        onError?.(err);
      },
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {serverError && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {step === 'email' ? (
        <div className="space-y-4">
          <FormField
            label="Email"
            type="email"
            placeholder="Email address"
            autoComplete="email"
            error={errors.email?.message}
            required
            className="h-14 text-lg"
            aria-invalid={!!errors.email}
            {...registerField('email')}
          />

          <Button
            type="button"
            onClick={handleContinue}
            className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
          >
            Continue
          </Button>

          <OAuthDivider />

          <GoogleAuthButton
            mode="register"
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
          
          <div className="text-center mt-4">
             <span className="text-sm text-gray-600">Already have an account? </span>
             <Link href={AUTH_ROUTES.LOGIN} className="text-sm font-semibold text-gray-800 hover:underline">
               Log in
             </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <div className="flex items-center mb-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="p-0 hover:bg-transparent"
              onClick={() => setStep('email')}
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </Button>
            <div className="flex-1 text-center pr-8">
              <span className="text-sm text-gray-500">{emailValue}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="First name"
                placeholder="First name"
                autoComplete="given-name"
                error={errors.first_name?.message}
                required
                {...registerField('first_name')}
              />

              <FormField
                label="Last name"
                placeholder="Last name"
                autoComplete="family-name"
                error={errors.last_name?.message}
                required
                {...registerField('last_name')}
              />
            </div>

            <FormField
              label="Phone number"
              type="tel"
              placeholder="+254712345678"
              autoComplete="tel"
              error={errors.phone_number?.message}
              required
              {...registerField('phone_number')}
            />

            <PasswordField
              label="Password"
              placeholder="Password"
              autoComplete="new-password"
              showStrength
              error={errors.password?.message}
              required
              {...registerField('password')}
            />
            
            <PasswordField
              label="Confirm Password"
              placeholder="Confirm Password"
              autoComplete="new-password"
              error={errors.confirm_password?.message}
              required
              {...registerField('confirm_password')}
            />

            <div className="pt-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                I am a...
              </label>
              <RoleSelector
                value={role as any}
                onValueChange={(val) => {
                  setRole(val);
                }}
              />
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <input
                type="checkbox"
                id="agree_to_terms"
                className="mt-1 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                {...registerField('agree_to_terms')}
              />
              <label htmlFor="agree_to_terms" className="text-xs text-gray-500">
                By selecting <strong>Agree and continue</strong>, I agree to Rumi&apos;s{' '}
                <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>,{' '}
                <Link href="/payments-terms" className="text-blue-600 hover:underline">Payments Terms of Service</Link>, and{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
              </label>
            </div>
            {errors.agree_to_terms && (
              <p className="text-xs text-red-600">{errors.agree_to_terms.message}</p>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Creating account...
                </>
              ) : (
                'Agree and continue'
              )}
            </Button>
          </div>
        </form>
      )}

      {step === 'google-role-selection' && googleData && (
        <GoogleRoleSelection
          userInfo={googleData.userInfo}
          accessToken={googleData.accessToken}
          onBack={handleBackToEmail}
        />
      )}
    </div>
  );
}

RegisterForm.displayName = 'RegisterForm';
