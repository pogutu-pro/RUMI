import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PaybillPage from '@/app/(landlord)/landlord/rental/paybill/page';
import type { PaybillAccount, PaybillTransaction } from '../types';

const register = jest.fn();
const ignore = jest.fn().mockResolvedValue({});

const account: PaybillAccount = {
  id: 'pb1', shortcode: '600999', shortcode_type: 'paybill', display_name: 'Greenview', environment: 'production',
  is_active: true, has_credentials: false, registered_at: null, last_callback_at: null,
  callback_urls: { ConfirmationURL: 'x', ValidationURL: 'y' }, created_at: '',
};
const txn: PaybillTransaction = {
  id: 't1', shortcode: '600999', trans_id: 'QK12AB34CD', trans_type: 'Pay Bill', trans_time: '2026-05-05T07:30:00Z',
  amount: '22000.00', bill_ref_number: 'WRONG', msisdn: '', payer_name: 'John Kamau', status: 'unmatched',
  matched_by: '', tenancy: null, tenant_name: null, unit_number: null, payment: null, receipt_number: null,
  note: '', resolved_at: null, received_at: '',
};

jest.mock('@/features/paybill/hooks', () => ({
  usePaybillAccounts: () => ({ data: [account], isLoading: false }),
  usePaybillTransactions: () => ({ data: [txn], isLoading: false }),
  useRegisterPaybill: () => ({ mutate: register, isPending: false }),
  useConnectPaybill: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useAssignPaybillTxn: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useIgnorePaybillTxn: () => ({ mutateAsync: ignore, isPending: false }),
}));
jest.mock('@/features/rental/hooks/use-rental', () => ({ useTenancies: () => ({ data: [] }) }));

describe('PaybillPage', () => {
  it('blocks registration until credentials are added', () => {
    render(<PaybillPage />);
    expect(screen.getByText('Paybill 600999')).toBeInTheDocument();
    expect(screen.getByText('Add the Daraja consumer key and secret to register.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register with Safaricom' })).toBeDisabled();
  });

  it('shows unmatched payments and requires a reason to mark one as not rent', () => {
    render(<PaybillPage />);
    expect(screen.getByText('QK12AB34CD')).toBeInTheDocument();
    expect(screen.getByText('WRONG')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Not rent' }));
    const confirm = screen.getByRole('button', { name: 'Mark as not rent' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/shop sale/), { target: { value: 'Shop sale' } });
    fireEvent.click(confirm);
    expect(ignore).toHaveBeenCalledWith({ id: 't1', note: 'Shop sale' });
  });
});
