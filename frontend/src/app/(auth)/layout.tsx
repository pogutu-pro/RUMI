import type { Metadata } from 'next';
import { GoogleAuthProvider } from '@/components/providers/google-auth-provider';
import { PublicThemeProvider } from '@/components/providers/public-theme-provider';

export const metadata: Metadata = {
  title: 'Authentication - RUMI',
  description: 'Sign in or create an account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicThemeProvider>
      <GoogleAuthProvider>
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            {children}
          </div>
        </div>
      </GoogleAuthProvider>
    </PublicThemeProvider>
  );
}
