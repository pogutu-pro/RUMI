'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useInitiatePayment } from '@/features/payments';

const paymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  bookingId?: string;
  amount?: number;
  onSuccess?: () => void;
}

export function PaymentForm({ bookingId, amount, onSuccess }: PaymentFormProps) {
  const initiatePayment = useInitiatePayment();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      bookingId: bookingId || '',
      amount: amount || 0,
    },
  });

  const watchedAmount = useWatch({
    control: form.control,
    name: 'amount',
  });

  async function onSubmit(data: PaymentFormValues) {
    initiatePayment.mutate(
      {
        bookingId: data.bookingId,
        method: 'paystack',
      },
      {
        onSuccess: () => {
          onSuccess?.();
          form.reset();
        },
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Make Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (KES)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={initiatePayment.isPending}
            >
              {initiatePayment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Pay KES {watchedAmount?.toLocaleString()}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
