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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rumiarent.co.ke',
    siteName: 'RumiaRent',
    title: 'RumiaRent - Rental Management for Kenyan Landlords',
    description:
      'Properties, units, tenants, rent, and payments in one simple place for Kenyan landlords and property agents.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RumiaRent rental management platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RumiaRent - Rental Management for Kenyan Landlords',
    description:
      'Manage properties, tenants, and rent collection in one place.',
    images: ['/og-image.png'],
  },
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
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <BackToTop />
      </div>
    </UnifiedThemeProvider>
  );
}
