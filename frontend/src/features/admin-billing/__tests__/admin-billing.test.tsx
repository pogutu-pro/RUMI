import '@testing-library/jest-dom';
import * as React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AdminOrganizationsPage from '@/app/(super-admin)/platform/organizations/page';
import AdminBillingDetailPage from '@/app/(super-admin)/platform/billing/[id]/page';
import AdminLayout from '@/app/(super-admin)/platform/layout';
import { adminBillingApi } from '@/features/admin-billing/api/admin-billing';
import { UserRole } from '@/features/auth/stores/auth.types';
import type { AdminBillingDetail } from '@/features/admin-billing/types';

// Mock the API layer only (not the hooks) so the real useAdminBillingList /
// useAdminBillingDetail / useOverrideSubscription hooks run against
// TanStack Query, proving the search wiring genuinely reaches the backend
// call rather than a client-side filter of already-loaded rows.
jest.mock('@/features/admin-billing/api/admin-billing', () => ({
  adminBillingApi: {
    listOrganizations: jest.fn(),
    getOrganization: jest.fn(),
    overrideSubscription: jest.fn(),
  },
}));

// Avoid hitting the real billing-plans endpoint from the override dialog's
// plan Select — this feature's tests only care about reason-field gating.
jest.mock('@/features/billing/hooks/use-plans', () => ({
  usePlans: () => ({ data: [] }),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'org-1' }),
}));

// Radix Select needs real viewport measurement (scrollIntoView,
// hasPointerCapture) that jsdom doesn't implement — mocked as plain divs,
// same pattern TESTING.md documents for dropdown-menu. Tests never open
// this dropdown, only the reason Textarea.
jest.mock('@/components/ui/select', () => {
  const ReactLib = require('react');
  return {
    Select: ({ children }: { children?: React.ReactNode }) => ReactLib.createElement('div', null, children),
    SelectTrigger: ({ children }: { children?: React.ReactNode }) => ReactLib.createElement('div', null, children),
    SelectValue: () => ReactLib.createElement('span', null),
    SelectContent: ({ children }: { children?: React.ReactNode }) => ReactLib.createElement('div', null, children),
    SelectItem: ({ children }: { children?: React.ReactNode }) => ReactLib.createElement('div', null, children),
  };
});

// Shallow-render DashboardShell so we can assert the exact allowedRoles prop
// AdminLayout passes it, without pulling in useAuth/router/media-query.
jest.mock('@/components/dashboard/dashboard-shell', () => {
  const ReactLib = require('react');
  return {
    DashboardShell: ({ allowedRoles, children }: { allowedRoles: string[]; children?: React.ReactNode }) =>
      ReactLib.createElement(
        'div',
        { 'data-testid': 'dashboard-shell', 'data-allowed-roles': JSON.stringify(allowedRoles) },
        children,
      ),
  };
});

const mockedListOrganizations = adminBillingApi.listOrganizations as jest.Mock;
const mockedGetOrganization = adminBillingApi.getOrganization as jest.Mock;

const DETAIL_FIXTURE: AdminBillingDetail = {
  organization: {
    id: 'org-1',
    name: 'Acme Rentals',
    slug: 'acme-rentals',
    organization_type: 'individual',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  subscription: {
    id: 'sub-1',
    plan: 'plan-1',
    plan_details: {
      id: 'plan-1',
      name: 'Pro',
      slug: 'pro',
      price: '2000.00',
      interval: 'monthly',
      max_properties: 10,
      max_units: 100,
      max_caretaker_seats: 5,
      features: {},
    },
    status: 'active',
    billing_mode: 'auto',
    current_period_start: null,
    current_period_end: null,
    grace_period_ends_at: null,
    auto_renew: true,
    cancel_at_period_end: false,
  },
  effective_plan: {
    id: 'plan-1',
    name: 'Pro',
    slug: 'pro',
    price: '2000.00',
    interval: 'monthly',
    max_properties: 10,
    max_units: 100,
    max_caretaker_seats: 5,
    features: {},
  },
  payout: {
    status: 'active',
    account_name: 'Acme Rentals',
    bank_name: 'KCB',
    bank_account_number_masked: '****1234',
    last_verified_at: null,
    updated_at: '2026-01-01T00:00:00Z',
  },
  last_charge_event: null,
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('AdminOrganizationsPage — search wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListOrganizations.mockResolvedValue([]);
  });

  it('debounces the SearchInput 300ms then calls adminBillingApi.listOrganizations with the typed search string', async () => {
    jest.useFakeTimers();
    renderWithClient(<AdminOrganizationsPage />);

    const input = screen.getByPlaceholderText('Search by organization name…');
    fireEvent.change(input, { target: { value: 'Acme' } });

    // Advancing < 300ms must not have fired the backend call yet.
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(mockedListOrganizations).not.toHaveBeenCalledWith('Acme');

    await act(async () => {
      jest.advanceTimersByTime(150);
    });

    expect(mockedListOrganizations).toHaveBeenCalledWith('Acme');
    jest.useRealTimers();
  });
});

describe('AdminBillingDetailPage — no-charge-history empty state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "No charge history yet" when last_charge_event is null', async () => {
    mockedGetOrganization.mockResolvedValue({ ...DETAIL_FIXTURE, last_charge_event: null });
    renderWithClient(<AdminBillingDetailPage />);

    expect(await screen.findByText('No charge history yet')).toBeInTheDocument();
  });
});

describe('AdminBillingDetailPage — override dialog reason gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps "Apply override" disabled until a non-whitespace reason is entered', async () => {
    mockedGetOrganization.mockResolvedValue(DETAIL_FIXTURE);
    renderWithClient(<AdminBillingDetailPage />);

    await screen.findByText('Acme Rentals');
    fireEvent.click(screen.getByText('Override subscription'));

    const submit = await screen.findByRole('button', { name: 'Apply override' });
    expect(submit).toBeDisabled();

    const reasonField = screen.getByPlaceholderText(/Manual bank transfer received/);

    // Whitespace-only reason must stay disabled — the schema's .trim() validator.
    fireEvent.change(reasonField, { target: { value: '   ' } });
    expect(submit).toBeDisabled();

    fireEvent.change(reasonField, { target: { value: 'Comped for support ticket #123' } });
    expect(submit).not.toBeDisabled();

    fireEvent.change(reasonField, { target: { value: '' } });
    expect(submit).toBeDisabled();
  });
});

describe('AdminLayout — role restriction', () => {
  it('passes allowedRoles={[UserRole.SUPER_ADMIN]} to DashboardShell, excluding landlord/caretaker', () => {
    render(
      <AdminLayout>
        <div>child</div>
      </AdminLayout>,
    );

    const shell = screen.getByTestId('dashboard-shell');
    const allowedRoles = JSON.parse(shell.getAttribute('data-allowed-roles') || '[]');

    expect(allowedRoles).toEqual([UserRole.SUPER_ADMIN]);
    expect(allowedRoles).not.toContain(UserRole.LANDLORD);
    expect(allowedRoles).not.toContain(UserRole.CARETAKER);
  });
});
