'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OTPInput } from '@/components/ui/otp-input';
import { PasswordInput } from '@/components/ui/password-input';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import {
  useEmailLinkSignIn,
  useGoogleSignIn,
  useLogin,
  useRequestEmailLink,
  useSignInMethods,
} from '../hooks/use-auth';
import { GoogleButton } from './google-button';

type Intent = 'sign-in' | 'sign-up';
type Step = 'start' | 'sent' | 'password';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_SECONDS = 60;

// Webmail inboxes worth a one-tap shortcut on the "check your email" step.
const INBOXES: Record<string, { label: string; url: string }> = {
  'gmail.com': { label: 'Open Gmail', url: 'https://mail.google.com/mail/u/0/#search/rumiarent' },
  'googlemail.com': { label: 'Open Gmail', url: 'https://mail.google.com/mail/u/0/#search/rumiarent' },
  'outlook.com': { label: 'Open Outlook', url: 'https://outlook.live.com/mail/0/' },
  'hotmail.com': { label: 'Open Outlook', url: 'https://outlook.live.com/mail/0/' },
  'live.com': { label: 'Open Outlook', url: 'https://outlook.live.com/mail/0/' },
  'yahoo.com': { label: 'Open Yahoo Mail', url: 'https://mail.yahoo.com/' },
};

/** The server's own sentence when there is one, else a calm fallback. */
export function signInErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { message?: string; details?: { detail?: string } } | undefined;
  if (typeof e?.details?.detail === 'string' && e.details.detail) return e.details.detail;
  if (e?.message && !/status code|An error occurred|unexpected error/i.test(e.message)) return e.message;
  return fallback;
}

const COPY: Record<Intent, { title: string; subtitle: string }> = {
  'sign-in': { title: 'Welcome back', subtitle: 'Sign in to see who has paid.' },
  'sign-up': { title: 'Start your free month', subtitle: 'All features for 30 days. No card, no password.' },
};

/**
 * Sign in and sign up are the same flow: Google, or an emailed link. The
 * server signs in an existing address and creates a landlord account for a
 * new one, so nobody has to know which screen they belong on. Passwords stay
 * available for accounts that have one.
 */
export function SignInFlow({ intent, next }: { intent: Intent; next?: string | null }) {
  const [step, setStep] = useState<Step>('start');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [code, setCode] = useState('');

  const methods = useSignInMethods();
  const requestLink = useRequestEmailLink();
  const linkSignIn = useEmailLinkSignIn(next);
  const google = useGoogleSignIn(next);
  const googleClientId = methods.data?.google_client_id;

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const sendLink = (address = email) => {
    const clean = address.trim();
    if (!EMAIL_RE.test(clean)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    requestLink.mutate(
      { email: clean, next },
      {
        onSuccess: () => {
          setEmail(clean);
          setStep('sent');
          setResendIn(RESEND_SECONDS);
        },
        onError: (err) => {
          const e = err as { error?: string; details?: { retry_after?: number } };
          if (e?.error === 'rate_limited') {
            // An email already went out: show the code step rather than a dead end.
            setEmail(clean);
            setStep('sent');
            setResendIn(Math.min(e.details?.retry_after ?? RESEND_SECONDS, RESEND_SECONDS));
            return;
          }
          setError(signInErrorMessage(err, 'We could not send the email. Please try again.'));
        },
      },
    );
  };

  const onGoogle = (credential: string) => {
    setError(null);
    google.mutate(credential, {
      onError: (err) => setError(signInErrorMessage(err, 'Google sign-in failed. Try again or use your email.')),
    });
  };

  if (step === 'sent') {
    return (
      <CheckEmail
        email={email}
        resendIn={resendIn}
        resending={requestLink.isPending}
        verifying={linkSignIn.isPending}
        error={error}
        code={code}
        onCodeChange={setCode}
        onResend={() => sendLink()}
        onCode={(entered) => {
          setError(null);
          linkSignIn.mutate(
            { email, code: entered },
            {
              onError: (err) => {
                setCode(''); // start the next attempt from empty boxes
                setError(signInErrorMessage(err, 'That code did not work. Check the latest email.'));
              },
            },
          );
        }}
        onBack={() => {
          setStep('start');
          setError(null);
        }}
      />
    );
  }

  if (step === 'password') {
    return (
      <PasswordStep
        initialEmail={email}
        next={next}
        onUseLink={(address) => {
          setEmail(address);
          setStep('start');
          if (address) sendLink(address);
        }}
      />
    );
  }

  const copy = COPY[intent];
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">{copy.title}</h1>
      <p className="mt-1.5 text-[15px] text-gray-500">{copy.subtitle}</p>

      <div className="mt-8 space-y-4">
        {googleClientId && (
          <>
            <GoogleButton
              clientId={googleClientId}
              onCredential={onGoogle}
              text={intent === 'sign-up' ? 'signup_with' : 'continue_with'}
            />
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              or
              <span className="h-px flex-1 bg-gray-200" />
            </div>
          </>
        )}

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            sendLink();
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={!!error}
              aria-describedby={error ? 'sign-in-error' : undefined}
              className="h-11 text-base"
            />
          </div>
          {error && (
            <p id="sign-in-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="h-11 w-full text-base" isLoading={requestLink.isPending || google.isPending}>
            Continue with email
          </Button>
        </form>
        <p className="text-center text-xs text-gray-500">We will email you a link and a code. No password to remember.</p>
      </div>

      <div className="mt-8 space-y-3 border-t border-gray-100 pt-6 text-center text-sm text-gray-600">
        {intent === 'sign-in' ? (
          <>
            <button
              type="button"
              className="font-medium text-gray-900 underline-offset-4 hover:underline"
              onClick={() => {
                setError(null);
                setStep('password');
              }}
            >
              Sign in with a password instead
            </button>
            <p>
              New to RumiaRent?{' '}
              <Link href={AUTH_ROUTES.REGISTER} className="font-semibold text-primary hover:underline">
                Start free
              </Link>
            </p>
          </>
        ) : (
          <>
            <p>
              Already have an account?{' '}
              <Link href={AUTH_ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              Renting a home? Your landlord adds you. Then sign in here with the same email.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function CheckEmail({
  email,
  resendIn,
  resending,
  verifying,
  error,
  code,
  onCodeChange,
  onResend,
  onCode,
  onBack,
}: {
  email: string;
  resendIn: number;
  resending: boolean;
  verifying: boolean;
  error: string | null;
  code: string;
  onCodeChange: (code: string) => void;
  onResend: () => void;
  onCode: (code: string) => void;
  onBack: () => void;
}) {
  const inbox = INBOXES[email.split('@')[1]?.toLowerCase() ?? ''];

  return (
    <div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Mail className="h-6 w-6" aria-hidden />
      </div>
      <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-gray-900">Check your email</h1>
      <p className="mt-1.5 text-[15px] leading-relaxed text-gray-500">
        We sent a link to <span className="font-medium text-gray-900">{email}</span>. Tap it to continue, or type
        the 6-digit code from the email here.
      </p>

      <div className="mt-8 space-y-3">
        <OTPInput
          length={6}
          value={code}
          onChange={onCodeChange}
          onComplete={onCode}
          disabled={verifying}
          error={!!error}
          autoFocus
          ariaLabel="6-digit code from the email"
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {verifying && <p className="text-sm text-gray-500">Signing you in…</p>}
      </div>

      {inbox && (
        <Button asChild variant="outline" className="mt-6 h-11 w-full">
          <a href={inbox.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
            {inbox.label}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </Button>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Different email
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={resendIn > 0 || resending}
          className="font-medium text-primary hover:underline disabled:text-gray-400 disabled:no-underline"
        >
          {resendIn > 0 ? `Resend in ${resendIn}s` : resending ? 'Sending…' : 'Resend email'}
        </button>
      </div>
      <p className="mt-4 text-xs text-gray-500">Not there? Check spam or promotions. The link works for 15 minutes.</p>
    </div>
  );
}

function PasswordStep({
  initialEmail,
  next,
  onUseLink,
}: {
  initialEmail: string;
  next?: string | null;
  onUseLink: (email: string) => void;
}) {
  const router = useRouter();
  const login = useLogin(next);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim()) || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError(null);
    login.mutate(
      { email: email.trim(), password },
      {
        onError: (err) => {
          const e = err as { error?: string; statusCode?: number };
          if (e?.error === 'email_not_verified') {
            toast.info('Please verify your email. We have sent you a new code.');
            router.push(`${AUTH_ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(email.trim())}`);
            return;
          }
          if (e?.statusCode === 429) setError('Too many attempts. Wait a few minutes, or use an email link.');
          else if (e?.statusCode === 403) setError('This account is restricted. Contact support if this is a mistake.');
          else setError('That email and password do not match. No password yet? Use an email link instead.');
        },
      },
    );
  };

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">Sign in with password</h1>
      <p className="mt-1.5 text-[15px] text-gray-500">For accounts that have a password set.</p>
      <form noValidate onSubmit={submit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pw-email">Email</Label>
          <Input
            id="pw-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus={!initialEmail}
            className="h-11 text-base"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="pw-password">Password</Label>
            <Link href={AUTH_ROUTES.FORGOT_PASSWORD} className="text-xs font-medium text-gray-600 hover:text-gray-900">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="pw-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus={!!initialEmail}
            className="h-11 text-base"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="h-11 w-full text-base" isLoading={login.isPending}>
          Sign in
        </Button>
      </form>
      <div className="mt-8 border-t border-gray-100 pt-6 text-center text-sm">
        <button
          type="button"
          onClick={() => onUseLink(EMAIL_RE.test(email.trim()) ? email.trim() : '')}
          className="font-medium text-gray-900 underline-offset-4 hover:underline"
        >
          Email me a sign-in link instead
        </button>
      </div>
    </div>
  );
}
