import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PaybillPage from '@/app/(landlord)/landlord/rental/paybill/page';
import type { PaybillAccount, PaybillTransaction } from '../types';

const register = jest.fn();
const ignore = jest.fn().mockResolvedValue({});
const updatePaybill = jest.fn().mockResolvedValue({});

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
  useUpdatePaybill: () => ({ mutateAsync: updatePaybill, isPending: false }),
}));
jest.mock('@/features/rental/hooks/use-rental', () => ({ useTenancies: () => ({ data: [] }) }));

describe('PaybillPage', () => {
  it('blocks registration until Safaricom keys are added, and saves the keys', async () => {
    render(<PaybillPage />);
    expect(screen.getByText('Paybill 600999')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register with Safaricom' })).toBeDisabled();
    expect(screen.getByText('Turn on automatic M-Pesa receipts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Safaricom keys' }));
    const save = screen.getByRole('button', { name: 'Save keys' });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Consumer Key'), { target: { value: ' key123 ' } });
    fireEvent.change(screen.getByLabelText('Consumer Secret'), { target: { value: 'secret456' } });
    fireEvent.click(save);
    expect(updatePaybill).toHaveBeenCalledWith({
      id: 'pb1', payload: { consumer_key: 'key123', consumer_secret: 'secret456', environment: 'production' },
    });
  });

  it('shows unmatched payments and requires a reason to mark one as not rent', () => {
    render(<PaybillPage />);
    // Rendered twice: phone cards and the desktop table (CSS shows one).
    expect(screen.getAllByText('QK12AB34CD').length).toBeGreaterThan(0);
    expect(screen.getAllByText('WRONG').length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Not rent' })[0]);
    const confirm = screen.getByRole('button', { name: 'Mark as not rent' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/shop sale/), { target: { value: 'Shop sale' } });
    fireEvent.click(confirm);
    expect(ignore).toHaveBeenCalledWith({ id: 't1', note: 'Shop sale' });
  });
});
