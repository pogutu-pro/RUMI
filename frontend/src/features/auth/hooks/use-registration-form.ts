'use client';

import { useMemo } from 'react';
import { useForm, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { mapApiError, mapApiMessage } from '@/lib/api/error-mapping';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AuthResponse } from '@/types/api.types';

interface UseRegistrationFormOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues: T;
  role: 'student' | 'landlord' | 'caretaker';
  successMessage?: string;
}

export function useRegistrationForm<T extends FieldValues>({
  schema,
  defaultValues,
  role,
  successMessage = 'Registration successful! Please check your email to verify your account.',
}: UseRegistrationFormOptions<T>) {
  const router = useRouter();
  
  const form = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as any,
    mode: 'onTouched',
  });

  const mutation = useMutation({
    mutationFn: (data: T) => {
      switch (role) {
        case 'student':
          return authApi.registerStudent(data as any);
        case 'landlord':
          return authApi.registerLandlord(data as any);
        case 'caretaker':
          return authApi.registerCaretaker(data as any);
        default:
          throw new Error('Invalid role');
      }
    },
    onSuccess: () => {
      toast.success(successMessage);
      router.push('/login');
    },
    onError: (error: any) => {
      const apiErrorResponse = mapApiError(error);
      
      if (apiErrorResponse.errors.length > 0) {
        let focused = false;
        apiErrorResponse.errors.forEach((err) => {
          if (err.field) {
            form.setError(err.field as Path<T>, {
              type: 'server',
              message: err.message,
            });
            if (!focused) {
              form.setFocus(err.field as Path<T>);
              focused = true;
            }
          }
        });
      }
      
      if (!apiErrorResponse.errors.some(e => e.field)) {
        toast.error(apiErrorResponse.message || 'Registration failed');
      }
    },
  });

  const apiMessage = useMemo(
    () => mapApiMessage(mutation.error),
    [mutation.error]
  );

  const onSubmit = form.handleSubmit(async (data) => {
    // Basic phone normalization if present
    const payload = { ...data } as Record<string, any>;
    if (payload.phone_number && typeof payload.phone_number === 'string') {
      payload.phone_number = payload.phone_number.replace(/[^\d+]/g, '');
    }
    
    await mutation.mutateAsync(payload as T);
  });

  return {
    form,
    mutation,
    onSubmit,
    apiMessage,
    isSubmitting: form.formState.isSubmitting || mutation.isPending,
  };
}
