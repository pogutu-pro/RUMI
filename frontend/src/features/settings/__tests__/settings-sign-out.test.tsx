import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SettingsView } from '../components/settings-view';

const logout = jest.fn();
// Stable objects: the profile form resets whenever `data` changes identity.
const auth = { user: { email: 'grace@example.com' }, logout, updateProfile: jest.fn(), uploadPhoto: jest.fn() };
const profile = { data: { first_name: 'Grace', last_name: 'Mwangi', email: 'grace@example.com' }, isLoading: false };
const prefs = { data: { email_enabled: true, marketing_emails: false }, isLoading: false };
const updatePrefs = { mutate: jest.fn(), isPending: false };
const setTheme = jest.fn();
const themeState = { theme: undefined as string | undefined, setTheme };

jest.mock('next-themes', () => ({ useTheme: () => themeState }));

jest.mock('@/features/auth', () => ({
  useAuth: () => auth,
  useProfile: () => profile,
}));
jest.mock('@/features/notifications', () => ({
  useNotificationPreferences: () => prefs,
  useUpdateNotificationPreferences: () => updatePrefs,
}));

describe('Settings sign out', () => {
  it('is the place to sign out', () => {
    render(<SettingsView />);
    expect(screen.getByText(/Signed in as grace@example.com/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(logout).toHaveBeenCalled();
  });

  it('starts on Light and lets you pick Dark or System', () => {
    render(<SettingsView />);
    expect(screen.getByRole('radio', { name: /Light/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: /Dark/ }));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });
});
