import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
};

/**
 * The route guard sends signed-out visitors to login, so anyone who reaches
 * this page is signed in. /dashboard forwards them to their role's home.
 */
export default function ProfilePage(): never {
  redirect('/dashboard');
}
