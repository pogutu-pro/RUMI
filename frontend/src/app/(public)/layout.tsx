import { ReactNode } from 'react';
import { PublicHeader } from '@/components/layouts/public-header';
import { Footer } from '@/components/layouts/public-footer';
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav';
import { BackToTop } from '@/components/layouts/back-to-top';
import { UnifiedThemeProvider } from '@/components/providers/unified-theme-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'RumiaRent - Rental Management for Kenyan Landlords',
    template: '%s | RumiaRent',
  },
  description:
    'RumiaRent helps Kenyan landlords and agents manage properties, track tenants, and collect rent. Simple enough to start using today.',
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
        <MobileBottomNav />
        <BackToTop />
      </div>
    </UnifiedThemeProvider>
  );
}
