import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from './providers';
import { cn } from '@/lib/utils/cn';
import { getApiUrl } from '@/lib/utils/env';
import { SHARE_IMAGE, SITE_URL, SOCIAL_HANDLE } from '@/lib/seo';
import '@/styles/globals.css';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import NetworkStatus from '@/components/pwa/NetworkStatus';
import DevServiceWorkerCleaner from '@/components/pwa/DevServiceWorkerCleaner';
import ServiceWorkerUpdater from '@/components/pwa/ServiceWorkerUpdater';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { InitialSplash } from '@/components/ui/initial-splash';

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'RumiaRent: Rental Management for Kenyan Landlords',
    template: '%s | RumiaRent',
  },
  description:
    'RumiaRent helps Kenyan landlords and agents manage properties, track tenants, and collect rent. Simple enough to start using today.',
  keywords: [
    'rental management Kenya',
    'landlord software Kenya',
    'property management system Kenya',
    'rent collection app',
    'Paystack rent payment',
    'tenant management software',
    'property management for agents',
  ],
  authors: [{ name: 'Stratnovo', url: 'https://rumiarent.com/about' }],
  creator: 'Stratnovo',
  publisher: 'Stratnovo',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    title: 'RumiaRent: Rental Management for Kenyan Landlords',
    description:
      'Properties, units, tenants, rent, and payments in one simple place for Kenyan landlords and property agents.',
    siteName: 'RumiaRent',
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RumiaRent: Rental Management for Kenyan Landlords',
    description:
      'Manage properties, tenants, and rent collection in one place.',
    images: [{ url: SHARE_IMAGE.url, alt: SHARE_IMAGE.alt }],
    creator: SOCIAL_HANDLE,
    site: SOCIAL_HANDLE,
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
  appleWebApp: {
    statusBarStyle: 'default',
    title: 'RumiaRent',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  category: 'business',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'RumiaRent',
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      image: `${SITE_URL}${SHARE_IMAGE.url}`,
      description:
        'Rental management platform helping Kenyan landlords and agents manage properties, tenants, and rent collection.',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'KE',
        addressLocality: 'Nairobi',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'info@rumiarent.com',
        availableLanguage: ['en', 'sw'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'RumiaRent',
      url: SITE_URL,
      inLanguage: 'en-KE',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ];

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(inter.variable, jakarta.variable)}
      data-scroll-behavior="smooth"
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
          'min-h-screen bg-background font-sans antialiased overflow-x-clip scroll-smooth',
        )}
      >
        <InitialSplash />
        <ErrorBoundary>
          <Providers>
            {children}
            <PWAInstallPrompt />
            <NetworkStatus />
            <ServiceWorkerUpdater />
            <DevServiceWorkerCleaner />
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
