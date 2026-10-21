import type { Metadata } from 'next';

import { EmailLinkLanding } from './email-link-landing';

export const metadata: Metadata = {
  title: 'Signing in',
  robots: { index: false, follow: false },
};

export default async function EmailLinkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token, next } = await searchParams;
  return <EmailLinkLanding token={token ?? ''} next={next ?? null} />;
}
