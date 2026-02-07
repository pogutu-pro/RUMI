'use client';

import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api/client';

const paybillSchema = z.object({
  payment_type: z.enum(['paybill', 'till']),
  mpesa_number: z.string().regex(/^\d{5,7}$/, 'Must be 5-7 digits'),
  business_name: z.string().min(3, 'Business name required'),
});

type PaybillFormData = z.infer<typeof paybillSchema>;

interface PaybillConfigFormProps {
  hostelId: string;
}

export function PaybillConfigForm({ hostelId }: PaybillConfigFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'testing' | 'verified' | 'failed'>('idle');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaybillFormData>({
    resolver: zodResolver(paybillSchema),
    defaultValues: {
      payment_type: 'paybill',
    },
  });

  const paymentType = watch('payment_type');

  // Save configuration mutation
  const { mutate: saveConfig, isPending: saving } = useMutation({
    mutationFn: async (data: PaybillFormData) => {
      const response = await apiClient.axios.post(
        `/api/v1/hostels/${hostelId}/payment-config/`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Configuration saved',
        description: 'Payment configuration updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['payment-config', hostelId] });
      setVerificationStatus('testing');
    },
    onError: (error) => {
      toast({
        title: 'Failed to save configuration',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Test payment verification mutation
  const { mutate: verifyConfig, isPending: verifying } = useMutation({
    mutationFn: async () => {
      const response = await apiClient.axios.post(
        `/api/v1/hostels/${hostelId}/payment-config/verify/`
      );
      return response.data;
    },
    onSuccess: () => {
      setVerificationStatus('verified');
      toast({
        title: 'Verification successful',
        description: 'Payment configuration is active',
      });
    },
    onError: () => {
      setVerificationStatus('failed');
      toast({
        title: 'Verification failed',
        description: 'Please check your payment details',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: PaybillFormData) => {
    saveConfig(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Payment Type */}
      <div className="space-y-2">
        <Label htmlFor="payment-method">Payment Method</Label>
        <Select
          value={paymentType}
          onValueChange={(value) => setValue('payment_type', value as 'paybill' | 'till')}
        >
          <SelectTrigger id="payment-method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paybill">M-Pesa Paybill</SelectItem>
            <SelectItem value="till">M-Pesa Till Number</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* M-Pesa Number */}
      <div className="space-y-2">
        <Label htmlFor="mpesa_number">{paymentType === 'paybill' ? 'Paybill Number' : 'Till Number'}</Label>
        <Input
          id="mpesa_number"
          {...register('mpesa_number')}
          placeholder={paymentType === 'paybill' ? 'e.g., 548548' : 'e.g., 5123456'}
          maxLength={7}
        />
        {errors.mpesa_number && (
          <p className="text-xs text-red-600">{errors.mpesa_number.message}</p>
        )}
      </div>

      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="business_name">Business Name</Label>
        <Input
          id="business_name"
          {...register('business_name')}
          placeholder="As registered with M-Pesa"
        />
        {errors.business_name && (
          <p className="text-xs text-red-600">{errors.business_name.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Must match your M-Pesa registration exactly
        </p>
      </div>

      {/* Verification Status */}
      {verificationStatus !== 'idle' && (
        <div className={`flex items-start gap-2 p-3 rounded-lg border ${
          verificationStatus === 'verified'
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50'
            : verificationStatus === 'failed'
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
        }`}>
          {verificationStatus === 'verified' && (
            <>
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-green-900 dark:text-green-200">Configuration Verified</p>
                <p className="text-green-700 dark:text-green-300 mt-1">Your payment setup is active</p>
              </div>
            </>
          )}
          {verificationStatus === 'testing' && (
            <>
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-200">Testing Configuration</p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">Sending test payment...</p>
              </div>
            </>
          )}
          {verificationStatus === 'failed' && (
            <>
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-900 dark:text-red-200">Verification Failed</p>
                <p className="text-red-700 dark:text-red-300 mt-1">Please check your details and try again</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={saving || verifying}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </Button>

        {verificationStatus === 'testing' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => verifyConfig()}
            disabled={verifying}
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Payment'
            )}
          </Button>
        )}
      </div>

      {/* Instructions */}
      {verificationStatus === 'testing' && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Verification Steps:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>We'll sent a test payment of KES 50</li>
            <li>You'll receive an M-Pesa notification</li>
            <li>Click "Verify Payment" once received</li>
            <li>Configuration will be activated</li>
          </ol>
        </div>
      )}
    </form>
  );
}
