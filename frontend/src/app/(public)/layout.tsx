import { ReactNode } from 'react';
import { PublicHeader } from '@/components/layouts/public-header';
import { Footer } from '@/components/layouts/public-footer';
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav';
import { PublicThemeProvider } from '@/components/providers/public-theme-provider';
import CompareTray from '@/components/hostels/compare-tray';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Rumi - Your Campus Accomadation, Simplified',
    template: '%s | Rumi',
  },
  description:
    'Find verified campus hostels with safe bookings and trusted landlords. Rumi makes student housing simple.',
  keywords: [
    'student accommodation',
    'campus housing',
    'hostel booking',
    'student housing',
    'campus hostels',
  ],
  authors: [{ name: 'Rumi' }],
  creator: 'Rumi',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rumi.co.ke',
    siteName: 'Rumi',
    title: 'Rumi - Your Campus Life, Simplified',
    description:
      'Find verified campus hostels with safe bookings and trusted landlords. Rumi makes student housing simple.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Rumi student accommodation platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rumi - Your Campus Life, Simplified',
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
    <PublicThemeProvider>
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <CompareTray comparePath="/compare" />
      </div>
    </PublicThemeProvider>
  );
}
