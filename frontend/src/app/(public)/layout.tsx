import { ReactNode } from 'react';
import { PublicHeader } from '@/components/layouts/public-header';
import { Footer } from '@/components/layouts/public-footer';
import { BackToTop } from '@/components/layouts/back-to-top';
import { UnifiedThemeProvider } from '@/components/providers/unified-theme-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'RumiaRent - Rental Management for Kenyan Landlords',
    template: '%s | RumiaRent',
  },
  description:
    'M-Pesa rent collection and rental management for Kenyan landlords and agents: payments matched and receipted automatically, reminders, arrears and statements.',
  keywords: [
    'rental management Kenya',
    'landlord software Kenya',
    'property management system Kenya',
    'rent collection app',
    'tenant management software',
  ],
  authors: [{ name: 'Stratnovo' }],
  creator: 'Stratnovo',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

interface LayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: LayoutProps) {
  return (
    <UnifiedThemeProvider forcedTheme="light">
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <Footer />
        <BackToTop />
      </div>
    </UnifiedThemeProvider>
  );
}
