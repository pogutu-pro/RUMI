'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2, AlertCircle, ChevronLeft, User, Mail, Phone, Shield } from 'lucide-react';

import { FormField, PasswordField } from '@/components/ui/form-fields';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { GoogleAuthButton } from './google-auth-button';
import { OAuthDivider } from './oauth-divider';
import { useRegister, useCompleteGoogleLogin } from '../hooks/use-auth';
import {
  registerStudentSchema,
  registerLandlordSchema,
  type RegisterFormData,
} from '@/lib/validations/auth.schema';
import { cn } from '@/lib/utils/cn';
import { AUTH_ROUTES } from '@/lib/constants/routes';

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
  prefillEmail?: string;
}

type Step = 'email' | 'details' | 'google-details';
type Role = 'student' | 'landlord';

interface GoogleData {
  userInfo: {
    email: string;
    given_name: string;
    family_name: string;
    picture: string;
  };
  accessToken: string;
}

export function RegisterFormNew({ onSuccess, onError, className, prefillEmail = '' }: RegisterFormProps) {
  const [step, setStep] = useState<Step>('email');
  const [role, setRole] = useState<Role>('student');
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleData, setGoogleData] = useState<GoogleData | null>(null);
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);

  const { mutate: register, isPending } = useRegister();
  const { mutate: completeGoogleLogin, isPending: isGooglePending } = useCompleteGoogleLogin();

  const handleGoogleSuccess = (data: GoogleData) => {
    setGoogleData(data);
    setStep('google-details');
    setIsGoogleFlow(true);
  };

  const handleGoogleError = (err: any) => {
    setServerError(err?.message || 'Google sign in failed. Please try again.');
  };

  const handleBackToEmail = () => {
    setStep('email');
    setGoogleData(null);
    setIsGoogleFlow(false);
  };

  const schema = useMemo(() => {
    switch (role) {
      case 'student':
        return registerStudentSchema;
      case 'landlord':
        return registerLandlordSchema;
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
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      email: prefillEmail,
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

  // Pre-fill Google data when available
  React.useEffect(() => {
    if (googleData && isGoogleFlow) {
      setValue('email', googleData.userInfo.email);
      setValue('first_name', googleData.userInfo.given_name);
      setValue('last_name', googleData.userInfo.family_name);
    }
  }, [googleData, isGoogleFlow, setValue]);

  const handleContinue = async () => {
    const isEmailValid = await trigger('email');
    if (isEmailValid) {
      setStep('details');
    }
  };

  const onSubmit = (data: RegisterFormData) => {
    setServerError(null);
    
    if (isGoogleFlow && googleData) {
      // Complete Google registration
      completeGoogleLogin(
        { 
          token: googleData.accessToken, 
          role: data.role 
        },
        {
          onSuccess: () => {
            onSuccess?.();
          },
          onError: (err: any) => {
            const message =
              err?.response?.data?.error ||
              err?.message ||
              'Google registration failed. Please try again.';
            setServerError(message);
            onError?.(err);
          },
        }
      );
    } else {
      // Regular email registration
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
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {serverError && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {step === 'email' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Join RUMI and find your perfect accommodation</p>
          </div>

          <FormField
            label="Email"
            type="email"
            placeholder="Enter your email address"
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
      )}

      {step === 'details' && (
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

          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
            <p className="text-sm text-gray-600">Fill in your details to create your account</p>
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
              placeholder="+254 XXX XXX XXX"
              autoComplete="tel"
              error={errors.phone_number?.message}
              required
              {...registerField('phone_number')}
            />

            <PasswordField
              label="Password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              error={errors.password?.message}
              required
              {...registerField('password')}
            />

            <PasswordField
              label="Confirm password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              error={errors.confirm_password?.message}
              required
              {...registerField('confirm_password')}
            />

            <div className="space-y-3">
              <FormField
                label="I want to join as"
                error={errors.role?.message}
                required
                {...registerField('role')}
              >
                <select
                  className="w-full h-14 text-lg border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  {...registerField('role')}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="student">Student</option>
                  <option value="landlord">Landlord</option>
                </select>
              </FormField>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agree_to_terms"
                  {...registerField('agree_to_terms')}
                />
                <label htmlFor="agree_to_terms" className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="/terms" className="text-emerald-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-emerald-600 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agree_to_terms?.message && (
                <p className="text-sm text-red-600">{errors.agree_to_terms?.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      )}

      {step === 'google-details' && googleData && (
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
              onClick={handleBackToEmail}
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </Button>
            <div className="flex-1 text-center pr-8">
              <span className="text-sm text-gray-500">{googleData.userInfo.email}</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border-2 border-emerald-500">
              <img 
                src={googleData.userInfo.picture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
            <p className="text-sm text-gray-600">Welcome! Just a few more details to get started</p>
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
              placeholder="+254 XXX XXX XXX"
              autoComplete="tel"
              error={errors.phone_number?.message}
              required
              {...registerField('phone_number')}
            />

            <div className="space-y-3">
              <FormField
                label="I want to join as"
                error={errors.role?.message}
                required
                {...registerField('role')}
              >
                <select
                  className="w-full h-14 text-lg border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  {...registerField('role')}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="student">Student</option>
                  <option value="landlord">Landlord</option>
                </select>
              </FormField>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agree_to_terms"
                  {...registerField('agree_to_terms')}
                />
                <label htmlFor="agree_to_terms" className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="/terms" className="text-emerald-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-emerald-600 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agree_to_terms?.message && (
                <p className="text-sm text-red-600">{errors.agree_to_terms?.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
            disabled={isGooglePending}
          >
            {isGooglePending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Creating Account...
              </>
            ) : (
              'Complete Registration'
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
