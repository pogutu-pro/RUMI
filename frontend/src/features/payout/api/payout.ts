import { axiosInstance as axios } from '@/lib/api/client';
import type { PayoutAccountStatus, SubmitPayoutDetailsPayload } from '../types';

/**
 * RumiaRent payout API client. Endpoints return raw serialized data (no
 * {success, data} envelope) — see Backend/organizations/views.py
 * PayoutAccountView.
 *
 * GET returns a `status: 'not_started'` shape as a normal 200 when no
 * PayoutAccount row exists yet — not an error (NOT_STARTED_RESPONSE).
 */
export const payoutApi = {
  getStatus: async (): Promise<PayoutAccountStatus> => {
    const res = await axios.get<PayoutAccountStatus>('/organizations/payout/');
    return res.data;
  },
  submitBankDetails: async (
    payload: SubmitPayoutDetailsPayload,
  ): Promise<PayoutAccountStatus> => {
    const res = await axios.post<PayoutAccountStatus>('/organizations/payout/', payload);
    return res.data;
  },
};
