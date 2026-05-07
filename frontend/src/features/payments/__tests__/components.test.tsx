/**
 * Comprehensive Frontend Component Tests
 *
 * Tests payment components:
 * - PaymentOptionsModal
 * - PaymentStatusTracker
 * - PaymentHistoryTable
 * - ReceiptGenerator
 * - SubscriptionOverviewCard
 * - InvoiceHistoryList
 * - PaymentLedgerViewer
 *
 * Run: pnpm test
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, beforeEach, afterEach, jest } from '@jest/globals';


// Create shared mock functions so both default and named exports reference the same fns
const mockGet = jest.fn<any>();
const mockPost = jest.fn<any>();

// Mock API client - both default and named exports
jest.mock('@/lib/api/client', () => ({
  __esModule: true,
  default: {
    axios: {
      get: mockGet,
      post: mockPost,
    },
    get: mockGet,
    post: mockPost,
  },
  apiClient: {
    axios: {
      get: mockGet,
      post: mockPost,
    },
    get: mockGet,
    post: mockPost,
  },
}));

// Test wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// =============================================================================
// GLOBAL SETUP
// =============================================================================

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  // Set default successful response to prevent crashes
  mockGet.mockResolvedValue({ data: { data: [] } });
  mockPost.mockResolvedValue({ data: { data: {} } });
});

// =============================================================================
// WEEK 1 TESTS: Student Payment Flow
// =============================================================================

describe('PaymentOptionsModal', () => {
  it('should render modal with payment option', () => {
    const { PaymentOptionsModal } = require('@/features/payments/components/payment-options-modal');

    render(
      <PaymentOptionsModal
        isOpen={true}
        onClose={() => {}}
        bedId="bed-123"
        amount={5000}
        bookingId="booking-123"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Make Payment/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Paystack/i).length).toBeGreaterThanOrEqual(1);
  });
});

describe('PaymentStatusTracker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should poll payment status every 5 seconds', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: {
          status: 'pending',
        },
      },
    });

    const { PaymentStatusTracker } = require('@/features/payments/components/payment-status-tracker');
    
    render(
      <PaymentStatusTracker transactionRef="TXN-123" />,
      { wrapper: createWrapper() }
    );

    // Should call immediately
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    // Advance by 5 seconds
    await React.act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });

  it('should stop polling when status is success', async () => {
    mockGet
      .mockResolvedValueOnce({
        data: { data: { status: 'pending' } },
      })
      .mockResolvedValueOnce({
        data: { data: { status: 'success', reference: 'RCPT123' } },
      });

    const { PaymentStatusTracker } = require('@/features/payments/components/payment-status-tracker');
    
    render(
      <PaymentStatusTracker transactionRef="TXN-123" />,
      { wrapper: createWrapper() }
    );

    await React.act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await React.act(async () => {
      jest.advanceTimersByTime(5000); // Second advance just in case
    });

    // Wait for the mock to be called and UI to update
    await waitFor(() => {
      expect(screen.getByText(/Payment confirmed/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Should stop polling
    const initialCallCount = mockGet.mock.calls.length;
    
    await React.act(async () => {
      jest.advanceTimersByTime(20000); 
    });
    
    expect(mockGet.mock.calls.length).toBe(initialCallCount);
  });
});

describe('PaymentHistoryTable', () => {
  it('should render transaction list', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          {
            id: '1',
            reference: 'TXN-001',
            amount: 5000,
            status: 'success',
            created_at: '2026-02-07T10:00:00Z',
          },
        ],
      },
    });

    const { PaymentHistoryTable } = require('@/features/payments/components/payment-history-table');
    
    render(<PaymentHistoryTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('TXN-001')).toBeInTheDocument();
      expect(screen.getByText(/5,000/i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no transactions', async () => {
    mockGet.mockResolvedValue({
      data: { data: [] },
    });

    const { PaymentHistoryTable } = require('@/features/payments/components/payment-history-table');
    
    render(<PaymentHistoryTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/No payment history yet/i)).toBeInTheDocument();
    });
  });
});

describe('ReceiptGenerator', () => {
  it('should generate and download PDF receipt', async () => {
    mockPost.mockResolvedValue({
      data: {
        data: {
          receipt_number: 'RCPT-001',
          receipt_url: 'https://example.com/receipt.pdf',
        },
      },
    });

    global.open = jest.fn() as any;

    const { ReceiptGenerator } = require('@/features/payments/components/receipt-generator');
    
    const { getByRole } = render(
      <ReceiptGenerator 
        transactionRef="TXN-123" 
        trigger={<button>Download Receipt</button>}
      />,
      { wrapper: createWrapper() }
    );

    const button = getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.open).toHaveBeenCalledWith('https://example.com/receipt.pdf', '_blank');
    });
  });
});

// =============================================================================
// WEEK 2 TESTS: Landlord Subscription
// =============================================================================

jest.mock('@/features/payments/hooks/use-subscription-accrual');

describe('SubscriptionOverviewCard', () => {
  it('should display billing accrual data', async () => {
    const { useSubscriptionAccrual } = require('@/features/payments/hooks/use-subscription-accrual');
    (useSubscriptionAccrual as jest.Mock).mockReturnValue({
      data: {
        period_start: '2026-02-01',
        as_of: '2026-02-17',
        total_occupied_bed_days: 120,
        projected_accrual: 15000,
        currency: 'KES',
        hostel_breakdown: [
          { hostel__name: 'Test Hostel', bed_days: 120 },
        ],
      },
      isLoading: false,
    });

    const { SubscriptionOverviewCard } = require('@/features/payments/components/subscription-overview-card');

    render(
      <SubscriptionOverviewCard hostelId="hostel-123" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Test Hostel')).toBeInTheDocument();
    expect(screen.getAllByText('120').length).toBeGreaterThanOrEqual(1);
  });

  it('should show unavailable state when no data', () => {
    const { useSubscriptionAccrual } = require('@/features/payments/hooks/use-subscription-accrual');
    (useSubscriptionAccrual as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    const { SubscriptionOverviewCard } = require('@/features/payments/components/subscription-overview-card');

    render(
      <SubscriptionOverviewCard hostelId="hostel-123" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Billing information unavailable/i)).toBeInTheDocument();
  });
});

describe('InvoiceHistoryList', () => {
  it('should render invoice table', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          {
            id: '1',
            invoice_number: 'INV-2026-001',
            amount: 3430,
            status: 'paid',
            billing_period_start: '2026-01-01',
            billing_period_end: '2026-01-31',
            due_date: '2026-02-05',
            pdf_url: 'https://example.com/invoice.pdf',
          },
        ],
      },
    });

    const { InvoiceHistoryList } = require('@/features/payments/components/invoice-history-list');
    
    render(
      <InvoiceHistoryList hostelId="hostel-123" />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
      expect(screen.getByText(/paid/i)).toBeInTheDocument();
    });
  });
});

// =============================================================================
// WEEK 3 TESTS: Admin Tools
// =============================================================================

describe('PaymentLedgerViewer', () => {
  it('should display ledger entries', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          {
            id: '1',
            transaction_date: '2026-02-07',
            bed_code: 'TB-101A',
            student_name: 'John Doe',
            transaction_type: 'credit',
            amount: 5000,
            balance: 5000,
            description: 'Rent payment',
            reference: 'TXN-001',
          },
        ],
      },
    });

    const { PaymentLedgerViewer } = require('@/features/payments/components/payment-ledger-viewer');
    
    render(<PaymentLedgerViewer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('TB-101A')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getAllByText(/5,000/i)[0]).toBeInTheDocument();
    });
  });

  it('should search ledger entries', async () => {
    mockGet.mockResolvedValue({
      data: { data: [] },
    });

    const { PaymentLedgerViewer } = require('@/features/payments/components/payment-ledger-viewer');
    
    const { getByPlaceholderText, getByRole } = render(
      <PaymentLedgerViewer />,
      { wrapper: createWrapper() }
    );

    // Wait for initial load to finish so button is enabled
    await waitFor(() => {
      const btn = screen.queryByRole('button', { name: /search/i });
      expect(btn).not.toBeDisabled();
    }, { timeout: 4000 });

    const searchInput = getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'John Doe' } });
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(/No results found/i)).toBeInTheDocument();
    }, { timeout: 4000 });

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('search=John')
    );
  });
});

// =============================================================================
// RUN TESTS
// =============================================================================

export {};
