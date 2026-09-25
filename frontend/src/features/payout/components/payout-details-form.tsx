'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Combobox } from '@/components/ui/combobox';
import {
  wizardPayoutSchema,
  type WizardPayoutFormData,
} from '@/lib/validations/auth.schema';
import { usePayoutStatus, useSubmitPayoutDetails, useBankList } from '@/features/payout/hooks/use-payout';

/**
 * The bank-details form — used both from the dashboard (Billing & Payout
 * page) and from the landlord onboarding wizard's PayoutStep
 * (features/auth/components/landlord-onboarding-wizard.tsx), one
 * implementation instead of two forked copies.
 *
 * Bank is a live Paystack dropdown (GET /organizations/payout/banks/), not
 * a free-text "bank code" field a landlord would have no way to know —
 * selecting a bank sets both bank_name and bank_code together from the
 * same Paystack entry, so they can never mismatch.
 */
interface PayoutDetailsFormProps {
  onSuccess?: () => void;
  submitLabel?: string;
  fullWidthButton?: boolean;
}

export function PayoutDetailsForm({
  onSuccess,
  submitLabel = 'Save bank details',
  fullWidthButton = false,
}: PayoutDetailsFormProps) {
  const { data: payoutStatus } = usePayoutStatus();
  const { data: bankList, isLoading: banksLoading } = useBankList();
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

  const banks = bankList?.banks ?? [];
  const banksUnavailable = !banksLoading && banks.length === 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="bank_code"
          render={() => (
            <FormItem>
              <FormLabel>Bank</FormLabel>
              <FormControl>
                <Controller
                  control={form.control}
                  name="bank_code"
                  render={({ field }) => (
                    <Combobox
                      value={field.value}
                      onChange={(code) => {
                        const bank = banks.find((b) => b.code === code);
                        field.onChange(code);
                        if (bank) form.setValue('bank_name', bank.name);
                      }}
                      options={banks.map((bank) => ({ value: bank.code, label: bank.name }))}
                      disabled={banksLoading || banksUnavailable}
                      searchPlaceholder="Type to search banks…"
                      emptyText="No bank matches that."
                      placeholder={
                        banksLoading
                          ? 'Loading banks…'
                          : banksUnavailable
                            ? 'Bank list unavailable right now'
                            : 'Select your bank'
                      }
                    />
                  )}
                />
              </FormControl>
              {banksUnavailable && (
                <p className="text-xs text-muted-foreground">
                  {bankList?.detail || 'Bank selection is unavailable right now — check back soon.'}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bank_account_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account number</FormLabel>
              <FormControl>
                <Input {...field} inputMode="numeric" className="h-11" disabled={banksUnavailable} />
              </FormControl>
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
          size={fullWidthButton ? 'lg' : 'default'}
          className={fullWidthButton ? 'h-14 w-full rounded-full' : 'h-11 rounded-full px-8'}
          disabled={banksUnavailable}
          isLoading={submitPayout.isPending}
        >
          {banksLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
