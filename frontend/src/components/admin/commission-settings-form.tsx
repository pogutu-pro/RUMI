'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

const commissionSchema = z.object({
  bookingCommissionRate: z.number().min(0).max(100),
  paymentProcessingFee: z.number().min(0).max(100),
  landlordPayoutCommission: z.number().min(0).max(100),
  minimumCommission: z.number().min(0),
  maximumCommission: z.number().optional(),
});

type CommissionFormValues = z.infer<typeof commissionSchema>;

const defaultValues: CommissionFormValues = {
  bookingCommissionRate: 10,
  paymentProcessingFee: 2.5,
  landlordPayoutCommission: 5,
  minimumCommission: 500,
  maximumCommission: 50000,
};

export function CommissionSettingsForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionSchema),
    defaultValues,
  });

  async function onSubmit(data: CommissionFormValues) {
    setIsLoading(true);
    try {
      // API call to update commission settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Commission settings updated successfully');
    } catch (error) {
      toast.error('Failed to update commission settings');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Settings</CardTitle>
        <CardDescription>
          Configure platform commission rates and fees
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="bookingCommissionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Commission Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Percentage charged on each booking
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentProcessingFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Processing Fee (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Fee for processing payments
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="landlordPayoutCommission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Landlord Payout Commission (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Commission on landlord payouts
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minimumCommission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Commission (KES)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum commission amount per transaction
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maximumCommission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Commission (KES) (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum commission cap per transaction
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
