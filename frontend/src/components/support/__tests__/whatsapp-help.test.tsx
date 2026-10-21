import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { WhatsAppHelp, whatsappHelpUrl } from '../whatsapp-help';

jest.mock('@/features/auth/stores/auth.store', () => ({
  useAuthStore: (select: (s: { user: { email: string } }) => unknown) => select({ user: { email: 'grace@example.com' } }),
}));

describe('WhatsApp help', () => {
  it('opens a chat with support with the message written for the step', () => {
    const url = new URL(whatsappHelpUrl('paybill', { email: 'grace@example.com', business: 'Kamau Homes' }));
    expect(url.origin + url.pathname).toBe('https://wa.me/254757901596');
    expect(url.searchParams.get('text')).toBe(
      'Hi RumiaRent, please help me set up my M-Pesa paybill so tenant payments are matched automatically.\n' +
        'Business: Kamau Homes\nAccount: grace@example.com',
    );
  });

  it('includes the signed-in email and opens in a new tab', () => {
    render(<WhatsAppHelp topic="daraja" />);
    const link = screen.getByRole('link', { name: 'Get help on WhatsApp' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain('Account: grace@example.com');
  });
});
