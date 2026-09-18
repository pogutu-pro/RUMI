'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  wizardPayoutSchema,
  type WizardPayoutFormData,
} from '@/lib/validations/auth.schema';
import { usePayoutStatus, useSubmitPayoutDetails } from '@/features/payout/hooks/use-payout';

/**
 * The bank-details form — same schema/hook the landlord onboarding wizard's
 * PayoutStep uses (features/auth/components/landlord-onboarding-wizard.tsx),
 * extracted so it's reachable from the dashboard too, not only once during
 * onboarding. Before this, an organization created without going through
 * the wizard (or one that skipped this step) had no way to ever submit
 * bank details again — the Billing & Payout page only ever displayed
 * payout *status*, never gave a way to change it.
 */
export function PayoutDetailsForm({ onSuccess }: { onSuccess?: () => void }) {
  const { data: payoutStatus } = usePayoutStatus();
  const submitPayout = useSubmitPayoutDetails();
  const [showBankError, setShowBankError] = React.useState(false);

  const form = useForm<WizardPayoutFormData>({
    resolver: zodResolver(wizardPayoutSchema),
    defaultValues: { bank_name: '', bank_account_number: '', bank_code: '' },
  });

  // The raw bank_account_number is never returned by the backend once a
  // submission exists (PayoutAccountSerializer excludes it on purpose) —
  // only bank_name is safe to pre-fill; the masked number is shown as
  // read-only context text instead.
  React.useEffect(() => {
    if (payoutStatus && payoutStatus.status !== 'not_started' && payoutStatus.bank_name) {
      form.setValue('bank_name', payoutStatus.bank_name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payoutStatus]);

  const onSubmit = async (values: WizardPayoutFormData) => {
    setShowBankError(false);
    try {
      await submitPayout.mutateAsync(values);
      onSuccess?.();
    } catch (err) {
      const statusCode = (err as { statusCode?: number } | undefined)?.statusCode;
      if (statusCode === 502) {
        setShowBankError(true);
      }
      // A toast has already fired via useSubmitPayoutDetails's onError for
      // both the 502 and generic-validation cases.
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="bank_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Bank name</FormLabel>
              <FormControl>
                <Input {...field} className="h-11" placeholder="e.g. KCB Bank" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bank_account_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Account number</FormLabel>
              <FormControl>
                <Input {...field} inputMode="numeric" className="h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bank_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Bank code</FormLabel>
              <FormControl>
                <Input {...field} className="h-11" placeholder="e.g. 01" />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Paystack&apos;s settlement bank code — check your bank&apos;s Paystack listing if
                you&apos;re not sure.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {showBankError && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p className="font-semibold">We couldn&apos;t verify those bank details</p>
            <p>Double-check the account number and bank, then try again.</p>
          </div>
        )}

        <Button
          type="submit"
          variant="charcoal"
          className="h-11 rounded-full px-8"
          isLoading={submitPayout.isPending}
        >
          Save bank details
        </Button>
      </form>
    </Form>
  );
}
