import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import StatementsPage from '@/app/(landlord)/landlord/rental/statements/page';
import type { Statement } from '../types';

const download = jest.fn();
const statement: Statement = {
  organization_name: 'Test Org', property_name: 'All properties', period_start: '2026-05-01', period_end: '2026-05-31',
  cash: { received_by_channel: { Cash: '30000.00', 'M-Pesa paybill': '15000.00' }, received_total: '45000.00',
    deposits_refunded: '0.00', expenses_total: '5000.00', net_cash: '40000.00' },
  income_by_type: { 'Rent income': '37000.00' }, waivers: '1000.00',
  expenses_by_category: { 'Repairs and maintenance': '5000.00' },
  owed_opening: '22000.00', owed_closing: '13000.00', deposits_held_closing: '15000.00',
  tenants: [{ tenancy_id: 't1', tenant_name: 'John Kamau', unit_number: 'A101', property_name: 'Greenview',
    opening: '22000.00', invoiced: '22000.00', credited: '1000.00', paid: '30000.00', paid_from_deposit: '0.00',
    reversed: '0.00', closing: '13000.00' }],
  expenses: [],
};

jest.mock('@/features/books/hooks', () => ({
  useStatement: () => ({ data: statement, isLoading: false, isError: false }),
  useDownloadStatement: () => ({ mutate: download, isPending: false }),
}));
jest.mock('@/features/rental/hooks/use-rental', () => ({ useProperties: () => ({ data: [] }) }));

describe('StatementsPage', () => {
  it('shows cash summary, channels and the tenant balance table', () => {
    render(<StatementsPage />);
    expect(screen.getByText('KES 45,000')).toBeInTheDocument();
    expect(screen.getAllByText('KES 40,000').length).toBeGreaterThan(0);
    expect(screen.getByText('Received · M-Pesa paybill')).toBeInTheDocument();
    expect(screen.getByText('John Kamau')).toBeInTheDocument();
    expect(screen.getAllByText('KES 13,000').length).toBeGreaterThan(0);
  });

  it('downloads the PDF for the chosen month', () => {
    render(<StatementsPage />);
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2026-04' } });
    fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));
    expect(download).toHaveBeenCalledWith({ month: '2026-04', propertyId: undefined });
  });
});
