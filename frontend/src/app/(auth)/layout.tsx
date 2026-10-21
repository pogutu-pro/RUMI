import type { Metadata } from 'next';
import { UnifiedThemeProvider } from '@/components/providers/unified-theme-provider';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to RumiaRent or start your free month.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <UnifiedThemeProvider forcedTheme="light">{children}</UnifiedThemeProvider>;
}
