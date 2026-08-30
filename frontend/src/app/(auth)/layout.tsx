import type { Metadata } from 'next';
import { UnifiedThemeProvider } from '@/components/providers/unified-theme-provider';

export const metadata: Metadata = {
  title: 'Authentication - RumiaRent',
  description: 'Sign in or create an account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnifiedThemeProvider forcedTheme="light">
      <div className="min-h-screen flex items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8">

        <div className="w-full max-w-4xl space-y-8">
          {children}
        </div>
      </div>
    </UnifiedThemeProvider>
  );
}
