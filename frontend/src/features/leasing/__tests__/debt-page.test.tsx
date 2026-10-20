import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import DebtRecoveryPage from '@/app/(landlord)/landlord/rental/debt/page';

const generate = jest.fn();
const openCase = jest.fn();

jest.mock('@/features/leasing/hooks', () => ({
  useArrears: () => ({
    data: [{ tenancy: 't1', tenant_name: 'John Kamau', phone: '0722', unit_number: 'A101', property_name: 'Greenview',
      status: 'active', arrears: '22000.00', case: null }],
    isLoading: false,
  }),
  useStaff: () => ({ data: [{ id: 7, name: 'Care Taker', role: 'caretaker' }] }),
  useOpenCase: () => ({ mutate: openCase, isPending: false }),
  useUpdateCase: () => ({ mutate: jest.fn(), isPending: false }),
  useAddCaseNote: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useGenerateDocument: () => ({ mutate: generate, mutateAsync: jest.fn(), isPending: false, variables: undefined }),
}));

describe('DebtRecoveryPage', () => {
  it('lists tenants in arrears with the total', () => {
    render(<DebtRecoveryPage />);
    expect(screen.getByText('John Kamau')).toBeInTheDocument();
    expect(screen.getByText(/KES 22,000 in total/)).toBeInTheDocument();
  });

  it('sends a demand note and opens a case from the tenant panel', () => {
    render(<DebtRecoveryPage />);
    fireEvent.click(screen.getByText('John Kamau'));
    fireEvent.click(screen.getByRole('button', { name: 'Send demand note' }));
    expect(generate).toHaveBeenCalledWith({ tenancyId: 't1', kind: 'demand_note', pay_within_days: 7, send: true });
    fireEvent.click(screen.getByRole('button', { name: 'Open debt case' }));
    expect(openCase).toHaveBeenCalledWith({ tenancy: 't1', assigned_to: null, note: '' });
  });
});
