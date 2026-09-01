import withSerwistInit from '@serwist/next';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // PWA is fully disabled in development — no caching, no stale assets
  disable: isDev,
  // Exclude public static assets from precache; they are handled by runtime caching
  // with proper TTLs so logo/icon updates propagate without manual cache clearing
  exclude: [
    /\.map$/,
    /^manifest.*\.js$/,
    // Exclude unversioned public images — runtime cache handles them with short TTL
    /\/images\/logo\//,
    /\/images\/icons\//,
    /favicon.*\.png$/,
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  typescript: {
    // Enable TypeScript errors to ensure build integrity
    // TODO: Fix remaining TypeScript errors in caretaker pages
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // Service worker: never cache it so browsers always fetch the latest
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // Web manifest: short cache so icon/name changes propagate quickly
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        // Favicons and PWA icons: short cache, revalidate on every visit
        source: '/:file(favicon.*|apple-touch-icon.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        // Next.js hashed static assets: truly immutable
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Security headers for all routes
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL || 'http://localhost:8000'}/media/:path*`,
      },
    ];
  },
  turbopack: {
    root: __dirname,
  },
};

export default withSerwist(nextConfig);
