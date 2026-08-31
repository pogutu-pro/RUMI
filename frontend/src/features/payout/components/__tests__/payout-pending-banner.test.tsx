import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PayoutPendingBanner } from '../payout-pending-banner';
import { usePayoutStatus } from '../../hooks/use-payout';
import type { PayoutAccountStatus } from '../../types';

jest.mock('../../hooks/use-payout', () => ({
  usePayoutStatus: jest.fn(),
}));

function mockStatus(data: Partial<PayoutAccountStatus> | undefined) {
  (usePayoutStatus as jest.Mock).mockReturnValue({ data });
}

describe('PayoutPendingBanner', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the not-started copy (no bank details submitted yet) when status is not_started', () => {
    mockStatus({ status: 'not_started' });
    render(<PayoutPendingBanner />);
    expect(screen.getByText('Finish setting up your payouts')).toBeInTheDocument();
    expect(
      screen.getByText('Add your bank details so rent payments can route to you.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Your bank details are submitted and being verified. Rent payments won't route to you until this completes.",
      ),
    ).not.toBeInTheDocument();
  });

  it('renders the Copywriting Contract heading/body when status is pending_verification', () => {
    mockStatus({ status: 'pending_verification' });
    render(<PayoutPendingBanner />);
    expect(screen.getByText('Finish setting up your payouts')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your bank details are submitted and being verified. Rent payments won't route to you until this completes.",
      ),
    ).toBeInTheDocument();
  });

  it('renders nothing when status is active', () => {
    mockStatus({ status: 'active' });
    const { container } = render(<PayoutPendingBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while data is still loading (undefined)', () => {
    mockStatus(undefined);
    const { container } = render(<PayoutPendingBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('has a collapse/expand toggle but no dismiss/close button, and collapsing hides the body while keeping the header visible', () => {
    mockStatus({ status: 'pending_verification' });
    render(<PayoutPendingBanner />);

    // No close/dismiss button anywhere.
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Collapse' });
    expect(toggle).toBeInTheDocument();

    fireEvent.click(toggle);

    // Header stays, body text is gone, toggle flips to "Expand".
    expect(screen.getByText('Finish setting up your payouts')).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Your bank details are submitted and being verified. Rent payments won't route to you until this completes.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
  });
});
