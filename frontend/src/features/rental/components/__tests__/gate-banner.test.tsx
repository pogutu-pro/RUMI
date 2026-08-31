import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GateBanner } from '../gate-banner';
import type { GateRejection } from '@/lib/api/gate';

const fixture: GateRejection = {
  detail: 'Property limit reached for your plan.',
  gate: 'max_properties',
  current_tier: 'starter',
  required_tier: 'pro',
};

describe('GateBanner', () => {
  it('renders the gate-specific title, backend detail text, and upgrade copy', () => {
    render(<GateBanner gate={fixture} onDismiss={jest.fn()} />);
    expect(screen.getByText('Property limit reached')).toBeInTheDocument();
    expect(screen.getByText('Property limit reached for your plan.')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Pro to unlock this.')).toBeInTheDocument();
  });

  it('renders a "See plans" link to /pricing', () => {
    render(<GateBanner gate={fixture} onDismiss={jest.fn()} />);
    const link = screen.getByRole('link', { name: 'See plans' });
    expect(link).toHaveAttribute('href', '/pricing');
  });

  it('calls onDismiss exactly once when "Not now" is clicked, without throwing', () => {
    const onDismiss = jest.fn();
    render(<GateBanner gate={fixture} onDismiss={onDismiss} />);
    expect(() => fireEvent.click(screen.getByText('Not now'))).not.toThrow();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
