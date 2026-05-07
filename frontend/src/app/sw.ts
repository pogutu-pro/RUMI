import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
  RangeRequestsPlugin,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & SerwistGlobalConfig;

// ─── Cache names ────────────────────────────────────────────────────────────
const CACHE_VERSION = 'v1';
const CACHES = {
  pages: `rumia-pages-${CACHE_VERSION}`,
  api: `rumia-api-${CACHE_VERSION}`,
  images: `rumia-images-${CACHE_VERSION}`,
  staticJs: `rumia-static-js-${CACHE_VERSION}`,
  staticCss: `rumia-static-css-${CACHE_VERSION}`,
  fonts: `rumia-fonts-${CACHE_VERSION}`,
  googleFonts: `rumia-google-fonts-${CACHE_VERSION}`,
};

// ─── Runtime caching rules ───────────────────────────────────────────────────
const runtimeCaching = [
  // Google Fonts stylesheets — StaleWhileRevalidate (short TTL)
  {
    matcher: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: CACHES.googleFonts,
      plugins: [new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60 })],
    }),
  },
  // Google Fonts files — CacheFirst (immutable)
  {
    matcher: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    handler: new CacheFirst({
      cacheName: CACHES.fonts,
      plugins: [new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 })],
    }),
  },
  // Local font files — CacheFirst (immutable, content-hashed by Next.js)
  {
    matcher: /\/_next\/static\/media\/.+\.(woff2?|ttf|otf|eot)$/i,
    handler: new CacheFirst({
      cacheName: CACHES.fonts,
      plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 })],
    }),
  },
  // Next.js static JS chunks — CacheFirst (content-hashed, truly immutable)
  {
    matcher: /\/_next\/static\/.+\.js$/i,
    handler: new CacheFirst({
      cacheName: CACHES.staticJs,
      plugins: [new ExpirationPlugin({ maxEntries: 128, maxAgeSeconds: 365 * 24 * 60 * 60 })],
    }),
  },
  // Next.js static CSS — CacheFirst (content-hashed, truly immutable)
  {
    matcher: /\/_next\/static\/.+\.css$/i,
    handler: new CacheFirst({
      cacheName: CACHES.staticCss,
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 365 * 24 * 60 * 60 })],
    }),
  },
  // Next.js image optimisation endpoint — StaleWhileRevalidate
  {
    matcher: /\/_next\/image\?url=.+$/i,
    handler: new StaleWhileRevalidate({
      cacheName: CACHES.images,
      plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
  },
  // Auth endpoints — NetworkOnly (never cache)
  {
    matcher: /\/api\/v1\/auth\/.*/,
    handler: new NetworkFirst({ networkTimeoutSeconds: 10 }),
  },
  // API GET requests — NetworkFirst with short cache fallback
  {
    matcher: ({ sameOrigin, url }: { sameOrigin: boolean; url: URL }) =>
      sameOrigin && url.pathname.startsWith('/api/'),
    method: 'GET' as const,
    handler: new NetworkFirst({
      cacheName: CACHES.api,
      networkTimeoutSeconds: 10,
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 5 * 60 })],
    }),
  },
  // HTML pages — NetworkFirst (never serve stale HTML permanently)
  {
    matcher: ({ request, sameOrigin, url }: { request: Request; sameOrigin: boolean; url: URL }) =>
      sameOrigin &&
      request.mode === 'navigate' &&
      !url.pathname.startsWith('/api/'),
    handler: new NetworkFirst({
      cacheName: CACHES.pages,
      networkTimeoutSeconds: 5,
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
    }),
  },
  // Static images in /public — StaleWhileRevalidate with short TTL
  // NOTE: short TTL ensures logo/icon updates propagate within 24h
  {
    matcher: /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: CACHES.images,
      plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 })],
    }),
  },
  // Audio/video — CacheFirst with range support
  {
    matcher: /\.(?:mp3|wav|ogg|mp4|webm)$/i,
    handler: new CacheFirst({
      cacheName: 'rumia-media',
      plugins: [
        new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 7 * 24 * 60 * 60 }),
        new RangeRequestsPlugin(),
      ],
    }),
  },
];

// ─── Service worker ──────────────────────────────────────────────────────────
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Clean up old precache caches from previous builds automatically
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  runtimeCaching,
});

// ─── Activate: purge all old versioned caches ────────────────────────────────
self.addEventListener('activate', (event: ExtendableEvent) => {
  const currentCacheNames = new Set(Object.values(CACHES));
  currentCacheNames.add('rumia-media');

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('rumia-') && !currentCacheNames.has(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

serwist.addEventListeners();
