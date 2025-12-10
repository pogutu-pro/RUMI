import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata, Route } from 'next';
import { AUTH_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = {
  title: 'Auth | Rumi',
  description:
    'Authenticate to access Rumi — student accommodation and hostel management.',
};

export default async function AuthIndexPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const nextParam = searchParams?.next;
  const cookieStore = await cookies();
  const token =
    cookieStore.get('rumi_access_token')?.value ??
    cookieStore.get('rumi_session')?.value ??
    cookieStore.get('session')?.value ??
    null;

  if (token) {
    const dest = nextParam ? String(nextParam) : '/dashboard';
    redirect(dest as Route);
  }

  const baseLogin = AUTH_ROUTES.LOGIN;
  const loginPath = nextParam
    ? `${baseLogin}?next=${encodeURIComponent(String(nextParam))}`
    : baseLogin;
  redirect(loginPath as Route);
}
