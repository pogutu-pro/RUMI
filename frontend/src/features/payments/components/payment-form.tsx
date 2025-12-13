'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useInitiatePayment } from '@/features/payments';

const paymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  method: z.enum(['mpesa', 'bank']),
  phoneNumber: z.string().optional(),
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
      method: 'mpesa',
      amount: amount || 0,
    },
  });

  const selectedMethod = form.watch('method');

  async function onSubmit(data: PaymentFormValues) {
    initiatePayment.mutate(
      { bookingId: data.bookingId, method: data.method },
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

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedMethod === 'mpesa' && (
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>M-Pesa Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+254700000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={initiatePayment.isPending}
            >
              {initiatePayment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Pay KES {form.watch('amount')?.toLocaleString()}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
