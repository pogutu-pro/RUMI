import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { InvoiceDetailSheet } from '../components/invoice-detail-sheet';
import type { InvoiceDetail } from '../types';

const mutate = jest.fn();
const mutateAsync = jest.fn().mockResolvedValue({});

const invoice: InvoiceDetail = {
  id: 'inv-1',
  number: 'INV-000007',
  invoice_type: 'rent',
  organization: 'org',
  tenancy: 'ten-1',
  property: 'prop',
  unit: 'unit',
  tenant: 'tenant',
  tenant_name: 'John Kamau',
  unit_number: 'A101',
  issue_date: '2026-05-01',
  period_start: '2026-05-01',
  period_end: '2026-05-31',
  due_date: '2026-05-05',
  amount_due: '25000.00',
  amount_paid: '10000.00',
  amount_credited: '1000.00',
  late_fee_amount: '0.00',
  outstanding: '14000.00',
  status: 'partially_paid',
  is_disputed: false,
  currency: 'KES',
  notes: '',
  lines: [
    { id: 'l1', line_type: 'rent', description: 'Rent', quantity: '1.000', unit_price: '22000.00', amount: '22000.00' },
    { id: 'l2', line_type: 'water', description: 'Water: 100 → 112', quantity: '12.000', unit_price: '250.00', amount: '3000.00' },
  ],
  source_invoice: null,
  created_at: '2026-05-01T00:00:00Z',
  credit_notes: [
    { id: 'c1', number: 'CN-000001', invoice: 'inv-1', invoice_number: 'INV-000007', amount: '1000.00', reason: 'Goodwill', issue_date: '2026-05-02', created_at: '' },
  ],
  payments: [{ payment_id: 'p1', reference: 'RUMIA-ABC', amount: '10000.00', paid_at: '2026-05-03T10:00:00Z', method: 'cash' }],
};

jest.mock('../hooks/use-ledger', () => ({
  useInvoice: () => ({ data: invoice, isLoading: false }),
  useIssueCreditNote: () => ({ mutateAsync, isPending: false }),
  useSetDisputed: () => ({ mutate, mutateAsync, isPending: false }),
}));

describe('InvoiceDetailSheet', () => {
  it('shows lines, credit notes, payments and the outstanding balance', () => {
    render(<InvoiceDetailSheet invoiceId="inv-1" onClose={jest.fn()} audience="landlord" />);
    expect(screen.getByText('INV-000007')).toBeInTheDocument();
    expect(screen.getByText('Water: 100 → 112')).toBeInTheDocument();
    expect(screen.getByText('12 × KES 250.00')).toBeInTheDocument();
    expect(screen.getByText(/CN-000001 · Goodwill/)).toBeInTheDocument();
    expect(screen.getByText('RUMIA-ABC')).toBeInTheDocument();
    expect(screen.getByText('KES 14,000.00')).toBeInTheDocument();
  });

  it('lets a landlord waive, but never more than is unpaid, and only with a reason', () => {
    render(<InvoiceDetailSheet invoiceId="inv-1" onClose={jest.fn()} audience="landlord" />);
    expect(screen.queryByText('Something wrong? Dispute')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Waive / discount'));

    const issue = screen.getByRole('button', { name: 'Issue credit note' });
    expect(issue).toBeDisabled(); // no reason yet
    fireEvent.change(screen.getByLabelText('Reason (shown on the credit note)'), { target: { value: 'Late fix' } });
    expect(issue).toBeEnabled();
    fireEvent.change(screen.getByLabelText(/^Amount/), { target: { value: '20000' } });
    expect(issue).toBeDisabled();
    expect(screen.getByText('Can’t credit more than is unpaid.')).toBeInTheDocument();
  });

  it('lets a tenant raise a dispute but not waive', () => {
    render(<InvoiceDetailSheet invoiceId="inv-1" onClose={jest.fn()} audience="tenant" />);
    expect(screen.queryByText('Waive / discount')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Something wrong? Dispute'));
    fireEvent.change(screen.getByPlaceholderText(/I paid this in cash/), { target: { value: 'Paid cash' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send dispute' }));
    expect(mutateAsync).toHaveBeenCalledWith({ invoiceId: 'inv-1', disputed: true, note: 'Paid cash' });
  });
});
