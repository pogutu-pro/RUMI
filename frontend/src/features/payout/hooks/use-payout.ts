'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { payoutApi } from '../api/payout';

const PAYOUT_STATUS_KEY = ['payout', 'status'] as const;

/**
 * `status: 'not_started'` is a valid 200 (see PayoutAccountView.get's
 * NOT_STARTED_RESPONSE) — no `enabled` gate needed here.
 */
export const usePayoutStatus = () =>
  useQuery({ queryKey: PAYOUT_STATUS_KEY, queryFn: payoutApi.getStatus });

/** Live Paystack bank list — long staleTime since this changes rarely and
 * every landlord hitting the payout form would otherwise refetch it. */
export const useBankList = () =>
  useQuery({
    queryKey: ['payout', 'banks'],
    queryFn: payoutApi.listBanks,
    staleTime: 1000 * 60 * 30,
  });

export const useSubmitPayoutDetails = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payoutApi.submitBankDetails,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYOUT_STATUS_KEY });
      toast.success('Bank details submitted for verification');
    },
    onError: (err) => {
      // 502 = Paystack account-resolve rejection (PaymentProviderError),
      // distinct from a generic 400 validation failure — see UI-SPEC's
      // Copywriting Contract and PayoutAccountView.post lines 115-116.
      const status = (err as { statusCode?: number } | undefined)?.statusCode;
      const message =
        status === 502
          ? "We couldn't verify those bank details. Double-check the account number and bank, then try again."
          : (err as { message?: string } | undefined)?.message || 'Could not submit bank details';
      toast.error(message);
    },
  });
};
