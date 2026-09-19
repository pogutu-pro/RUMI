import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardShell } from '../dashboard-shell';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/features/auth/stores/auth.types';
import { LayoutDashboard } from 'lucide-react';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  usePathname: () => '/landlord/rental',
}));

jest.mock('@/features/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/use-media-query', () => ({
  useMediaQuery: () => true, // force desktop layout so the sidebar (and OrganizationSwitcher) render directly
}));

jest.mock('@/features/rental/components/organization-switcher', () => ({
  OrganizationSwitcher: () => <div data-testid="org-switcher">OrgSwitcher</div>,
}));

jest.mock('@/features/notifications', () => ({
  NotificationBell: () => <div data-testid="notification-bell">Bell</div>,
}));

const NAV = [{ href: '/landlord/rental', label: 'Dashboard', icon: LayoutDashboard }];

function mockUser(role: UserRole, overrides: Partial<{ email: string; first_name: string; last_name: string }> = {}) {
  return {
    id: 'user-1',
    role,
    email: overrides.email ?? 'user@example.com',
    first_name: overrides.first_name ?? 'Test',
    last_name: overrides.last_name ?? 'User',
    is_verified: true,
  };
}

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  (useAuth as jest.Mock).mockReturnValue({
    user: null,
    status: 'authenticated',
    isAuthenticated: true,
    logout: jest.fn(),
    ...overrides,
  });
}

describe('DashboardShell', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /login when the user role is not in allowedRoles', () => {
    mockAuth({
      user: mockUser(UserRole.CARETAKER, { email: 'c@example.com', first_name: 'Carl', last_name: 'Taker' }),
    });
    render(
      <DashboardShell allowedRoles={[UserRole.LANDLORD, UserRole.SUPER_ADMIN]} nav={NAV} settingsHref="/landlord/rental/settings">
        <div>content</div>
      </DashboardShell>,
    );
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('renders children (no redirect) when the user role is in allowedRoles', () => {
    mockAuth({
      user: mockUser(UserRole.LANDLORD, { email: 'l@example.com', first_name: 'Lucy', last_name: 'Land' }),
    });
    render(
      <DashboardShell allowedRoles={[UserRole.LANDLORD, UserRole.SUPER_ADMIN]} nav={NAV} settingsHref="/landlord/rental/settings">
        <div>content</div>
      </DashboardShell>,
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders the loading fallback and does not redirect while status is checking', () => {
    mockAuth({ status: 'checking', isAuthenticated: false, user: null });
    render(
      <DashboardShell allowedRoles={[UserRole.LANDLORD, UserRole.SUPER_ADMIN]} nav={NAV} settingsHref="/landlord/rental/settings">
        <div>content</div>
      </DashboardShell>,
    );
    expect(screen.getByRole('status', { name: 'Loading your dashboard' })).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders OrganizationSwitcher for super_admin but not for landlord', () => {
    mockAuth({
      user: mockUser(UserRole.SUPER_ADMIN, { email: 's@example.com', first_name: 'Sam', last_name: 'Admin' }),
    });
    const { rerender } = render(
      <DashboardShell allowedRoles={[UserRole.LANDLORD, UserRole.SUPER_ADMIN]} nav={NAV} settingsHref="/landlord/rental/settings">
        <div>content</div>
      </DashboardShell>,
    );
    expect(screen.getByTestId('org-switcher')).toBeInTheDocument();

    mockAuth({
      user: mockUser(UserRole.LANDLORD, { email: 'l@example.com', first_name: 'Lucy', last_name: 'Land' }),
    });
    rerender(
      <DashboardShell allowedRoles={[UserRole.LANDLORD, UserRole.SUPER_ADMIN]} nav={NAV} settingsHref="/landlord/rental/settings">
        <div>content</div>
      </DashboardShell>,
    );
    expect(screen.queryByTestId('org-switcher')).not.toBeInTheDocument();
  });

  it('renders bannerSlot inside main above children when provided, and nothing extra when omitted', () => {
    mockAuth({
      user: mockUser(UserRole.LANDLORD, { email: 'l@example.com', first_name: 'Lucy', last_name: 'Land' }),
    });
    const { rerender } = render(
      <DashboardShell
        allowedRoles={[UserRole.LANDLORD, UserRole.SUPER_ADMIN]}
        nav={NAV}
        settingsHref="/landlord/rental/settings"
        bannerSlot={<div data-testid="banner">Banner</div>}
      >
        <div>content</div>
      </DashboardShell>,
    );
    expect(screen.getByTestId('banner')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();

    rerender(
      <DashboardShell allowedRoles={[UserRole.LANDLORD, UserRole.SUPER_ADMIN]} nav={NAV} settingsHref="/landlord/rental/settings">
        <div>content</div>
      </DashboardShell>,
    );
    expect(screen.queryByTestId('banner')).not.toBeInTheDocument();
  });
});
