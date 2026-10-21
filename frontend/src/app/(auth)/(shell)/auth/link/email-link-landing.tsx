'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, MailWarning } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { signInErrorMessage, useEmailLinkSignIn } from '@/features/auth';
import { AUTH_ROUTES } from '@/lib/constants/routes';

/**
 * Where the emailed link lands. The link is used up by this page's POST,
 * not by opening the URL, so mail scanners that pre-open links (Outlook,
 * Gmail) cannot spend it before the person taps it.
 */
export function EmailLinkLanding({ token, next }: { token: string; next: string | null }) {
  const signIn = useEmailLinkSignIn(next);
  const [error, setError] = useState<string | null>(token ? null : 'This link is incomplete. Ask for a new one.');
  const started = useRef(false);

  useEffect(() => {
    // Once only: React runs effects twice in development, and a second POST
    // would find the link already used.
    if (!token || started.current) return;
    started.current = true;
    signIn.mutate(
      { token },
      { onError: (err) => setError(signInErrorMessage(err, 'This link did not work. Ask for a new one.')) },
    );
  }, [token, signIn]);

  if (error) {
    return (
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <MailWarning className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-gray-900">Link expired</h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-gray-500">{error}</p>
        <Button asChild className="mt-8 h-11 w-full text-base">
          <Link href={next ? `${AUTH_ROUTES.LOGIN}?next=${encodeURIComponent(next)}` : AUTH_ROUTES.LOGIN}>
            Get a new link
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 text-center" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="mt-4 text-[15px] text-gray-600">Signing you in…</p>
    </div>
  );
}
