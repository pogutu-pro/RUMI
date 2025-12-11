import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from './providers';
import { cn } from '@/lib/utils/cn';
import { getApiUrl } from '@/lib/utils/env';
import '@/styles/globals.css';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import NetworkStatus from '@/components/pwa/NetworkStatus';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  weight: ['400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f2e1c' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://rumi.co.ke',
  ),
  title: {
    default: 'RUMI — Student Accommodation Made Easy',
    template: '%s | RUMI',
  },
  description:
    'Find and book verified student hostels near your university. Manage bookings, payments, and roommates seamlessly with the RUMI Platform.',
  keywords: [
    'student accommodation',
    'student housing Kenya',
    'university hostels',
    'hostel booking',
    'student rentals',
    'roommate matching',
    'verified hostels',
    'student apartments',
    'affordable student housing',
  ],
  authors: [{ name: 'RUMI Platform Team', url: 'https://rumi.co.ke/about' }],
  creator: 'RUMI Platform',
  publisher: 'RUMI Platform',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: '/',
    title: 'RUMI — Student Accommodation Made Easy',
    description:
      'Find verified student hostels near your university. Real-time availability and seamless booking.',
    siteName: 'RUMI',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'RUMI Platform — Smart Student Housing',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RUMI — Student Accommodation Made Easy',
    description: 'Book and manage student housing conveniently.',
    images: ['/images/og-image.jpg'],
    creator: '@rumiplatform',
    site: '@rumiplatform',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/favicon.png', sizes: '180x180', type: 'image/png' }],
  },

  alternates: { canonical: '/' },
  appleWebApp: {
    statusBarStyle: 'default',
    title: 'RUMI',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  category: 'education',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RUMI',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://rumi.co.ke',
    logo: `${process.env.NEXT_PUBLIC_APP_URL}/images/logo/logo.svg`,
    description:
      'Smart student housing platform connecting students with verified hostels across Kenya.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KE',
      addressLocality: 'Nairobi',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+254-757-901596',
      contactType: 'customer service',
      email: 'support@rumi.co.ke',
      availableLanguage: ['en', 'sw'],
    },
    sameAs: [
      'https://twitter.com/rumiplatform',
      'https://facebook.com/rumiplatform',
      'https://tiktok.com/rumiplatform',
      'https://instagram.com/rumiplatform',
      'https://linkedin.com/company/rumi-platform',
    ],
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(inter.variable, jakarta.variable)}
    >
      <head>
        <link rel="preconnect" href={getApiUrl()} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={getApiUrl()} />
        <link
          rel="preconnect"
          href="https://res.cloudinary.com"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>

      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased overflow-x-hidden scroll-smooth',
        )}
      >
        <ErrorBoundary>
          <Providers>
            {children}
            <PWAInstallPrompt />
            <NetworkStatus />
          </Providers>
        </ErrorBoundary>

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to main content
        </a>
      </body>
    </html>
  );
}
