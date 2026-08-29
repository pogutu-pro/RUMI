import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RumiaRent — Rental Management for Kenyan Landlords',
    short_name: 'RumiaRent',
    description:
      'RumiaRent helps Kenyan landlords and agents manage properties, track tenants, and collect rent via Paystack.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0B8E55',
    categories: ['productivity', 'business', 'utilities'],
    id: '/',
    dir: 'ltr',
    lang: 'en',
    prefer_related_applications: false,
    shortcuts: [
      {
        name: 'Sign in',
        short_name: 'Sign in',
        description: 'Sign in to your RumiaRent account',
        url: '/login',
        icons: [{ src: '/images/icons/icon-96x96.png', sizes: '96x96' }],
      },
    ],
    icons: [
      { src: '/images/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { src: '/images/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { src: '/images/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { src: '/images/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { src: '/images/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { src: '/images/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/images/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { src: '/images/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/images/icons/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/images/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
