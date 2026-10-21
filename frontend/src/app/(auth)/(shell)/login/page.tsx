import type { Metadata } from 'next';

import { SignInFlow } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to RumiaRent with Google or a link sent to your email.',
  alternates: { canonical: '/login' },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  // The middleware sends people here with ?next=; older links used ?redirect=.
  const next = params.next ?? params.redirect ?? null;
  const notice =
    params.session_expired === 'true'
      ? 'Your session expired. Please sign in again.'
      : params.verified === 'true'
        ? 'Email verified. You can now sign in.'
        : null;

  return (
    <>
      {notice && (
        <p role="status" className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {notice}
        </p>
      )}
      <SignInFlow intent="sign-in" next={next} />
    </>
  );
}
