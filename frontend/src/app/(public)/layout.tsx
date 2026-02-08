import { ReactNode } from 'react';
import { PublicHeader } from '@/components/layouts/public-header';
import { Footer } from '@/components/layouts/public-footer';
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav';
import { UnifiedThemeProvider } from '@/components/providers/unified-theme-provider';
import { CompareTray } from '@/features/hostels';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Rumia - Your Campus Accommodation, Simplified',
    template: '%s | Rumia',
  },
  description:
    'Find verified campus hostels with safe bookings and trusted landlords. Rumia makes student housing simple.',
  keywords: [
    'student accommodation',
    'campus housing',
    'hostel booking',
    'student housing',
    'campus hostels',
  ],
  authors: [{ name: 'Rumia' }],
  creator: 'Rumia',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rumia.co.ke',
    siteName: 'Rumia',
    title: 'Rumia - Your Campus Life, Simplified',
    description:
      'Find verified campus hostels with safe bookings and trusted landlords. Rumia makes student housing simple.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Rumia student accommodation platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rumia - Your Campus Life, Simplified',
    description:
      'Find verified campus hostels with safe bookings and trusted landlords.',
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
        <CompareTray comparePath="/compare" />
      </div>
    </UnifiedThemeProvider>
  );
}
