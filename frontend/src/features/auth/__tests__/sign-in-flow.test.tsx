import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SignInFlow } from '../components/sign-in-flow';

const requestLink = jest.fn();
const linkSignIn = jest.fn();
const googleSignIn = jest.fn();
const login = jest.fn();
let googleClientId: string | null = null;

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../components/google-button', () => ({
  GoogleButton: ({ onCredential }: { onCredential: (c: string) => void }) => (
    <button type="button" onClick={() => onCredential('google-id-token')}>Google</button>
  ),
}));
jest.mock('../hooks/use-auth', () => ({
  useSignInMethods: () => ({ data: { google_client_id: googleClientId, email_link: true } }),
  useRequestEmailLink: () => ({ mutate: requestLink, isPending: false }),
  useEmailLinkSignIn: () => ({ mutate: linkSignIn, isPending: false }),
  useGoogleSignIn: () => ({ mutate: googleSignIn, isPending: false }),
  useLogin: () => ({ mutate: login, isPending: false }),
}));

function typeEmail(value: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue with email' }));
}

describe('SignInFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    googleClientId = null;
    requestLink.mockImplementation((_vars, opts) => opts.onSuccess());
  });

  it('emails a link, then signs in with the pasted code', () => {
    render(<SignInFlow intent="sign-in" next="/landlord/rental/payments" />);
    typeEmail('grace@gmail.com');

    expect(requestLink).toHaveBeenCalledWith(
      { email: 'grace@gmail.com', next: '/landlord/rental/payments' }, expect.anything(),
    );
    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Gmail/ })).toBeInTheDocument();

    const [first] = screen.getAllByRole('textbox');
    fireEvent.paste(first, { clipboardData: { getData: () => '123 456' } });

    expect(linkSignIn).toHaveBeenCalledWith({ email: 'grace@gmail.com', code: '123456' }, expect.anything());
  });

  it('does not send for an invalid address', () => {
    render(<SignInFlow intent="sign-in" />);
    typeEmail('not-an-email');
    expect(requestLink).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
  });

  it('a just-sent email still opens the code step', () => {
    requestLink.mockImplementation((_vars, opts) =>
      opts.onError({ error: 'rate_limited', details: { retry_after: 60 } }),
    );
    render(<SignInFlow intent="sign-in" />);
    typeEmail('grace@example.com');
    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend in/ })).toBeDisabled();
  });

  it('hides Google until the server has a client ID', () => {
    render(<SignInFlow intent="sign-up" />);
    expect(screen.queryByRole('button', { name: 'Google' })).not.toBeInTheDocument();
  });

  it('signs in with Google when it is set up', () => {
    googleClientId = 'client-123';
    render(<SignInFlow intent="sign-up" />);
    fireEvent.click(screen.getByRole('button', { name: 'Google' }));
    expect(googleSignIn).toHaveBeenCalledWith('google-id-token', expect.anything());
  });

  it('keeps password sign-in for accounts that have one', () => {
    render(<SignInFlow intent="sign-in" />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with a password instead' }));
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'grace@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Secret#123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(login).toHaveBeenCalledWith({ email: 'grace@example.com', password: 'Secret#123' }, expect.anything());
  });

  it('sign-up tells tenants their landlord adds them', () => {
    render(<SignInFlow intent="sign-up" />);
    expect(screen.getByRole('heading', { name: 'Start your free month' })).toBeInTheDocument();
    expect(screen.getByText(/Your landlord adds you/)).toBeInTheDocument();
  });
});
