 import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type UserRole =
  | 'student'
  | 'tenant'
  | 'landlord'
  | 'caretaker'
  | 'super_admin'
  | 'tech_support'
  | 'tech_support_admin';

const TOKEN_COOKIE = 'rumi_access_token';
const ROLE_COOKIE = 'rumi_user_role';
const ONBOARDING_COOKIE = 'rumi_onboarding_stage';

// Only these roles have an onboarding wizard to complete. Everyone else
// (tenants and caretakers invited by a landlord, staff) has nothing to fill
// in: forcing them to /onboarding just sends them back to their dashboard,
// which sends them back to /onboarding - an endless redirect loop.
const ROLES_WITH_ONBOARDING = new Set<string>(['landlord', 'student']);

function needsOnboardingWizard(role?: UserRole): boolean {
  // Unknown role: keep the strict behaviour and let onboarding sort it out.
  return !role || ROLES_WITH_ONBOARDING.has(role);
}

// The backend commonly runs on a different origin than the frontend (e.g.
// localhost:8000 vs localhost:3000 in dev, or a separate api.* host in some
// deployments) — frontend/src/lib/api/client.ts talks to it via axios, and
// the browser enforces CSP connect-src on those requests. Without the API
// origin here, every XHR/fetch to the backend (including login itself) is
// silently blocked by the browser as a CSP violation, surfacing to the user
// as a generic "Network error" with no server round-trip at all. Mirrors the
// same fallback chain as frontend/src/lib/utils/env.ts:getApiUrl().
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api/v1';

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const API_ORIGIN = safeOrigin(API_BASE_URL);

const PUBLIC_ROUTES = new Set([
  '/',
  '/home',
  '/about',
  '/pricing',
  '/features',
  '/contact',
  '/privacy',
  '/terms',
  '/faq',
  '/how-it-works',
  '/careers',
  '/help-center',
  '/guides',
  '/cookies',
  '/compliance',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
  '/llms-full.txt',
  '/unsubscribe',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icon.png',
  '/apple-icon.png',
]);

const AUTH_ROUTES = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

const PUBLIC_PREFIXES = [
  '/blog',
  '/rentals',
  '/guides',
  '/for/',
  '/hostels',
  '/legal',
  '/verify-email',
  '/verify-phone',
];

const ROLE_RESTRICTED_PATHS: Record<string, UserRole[]> = {
  '/roommates': ['student', 'tenant'],
  '/tenants': ['landlord'],
  '/properties': ['landlord', 'caretaker'],
  '/platform': ['super_admin'],
  '/tech-support': ['tech_support', 'tech_support_admin', 'super_admin'],
};

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthPath(pathname: string): boolean {
  return AUTH_ROUTES.has(pathname);
}

// Mirrors AUTH_REDIRECTS in frontend/src/features/auth/hooks/use-auth.ts —
// keep these in sync or authenticated users get bounced to a route that
// doesn't exist (e.g. the old '/student/dashboard', '/admin/dashboard').
function getDashboardUrl(role?: UserRole): string {
  switch (role) {
    case 'landlord':
      return '/landlord/rental';
    case 'super_admin':
      return '/platform/overview';
    case 'caretaker':
      return '/caretaker/rental';
    case 'tech_support':
    case 'tech_support_admin':
      return '/tech-support/dashboard';
    case 'student':
    case 'tenant':
    default:
      return '/tenant/rental';
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const userRole = request.cookies.get(ROLE_COOKIE)?.value as
    | UserRole
    | undefined;
  const isAuthenticated = !!token;

  if (pathname === '/dashboard') {
    return NextResponse.redirect(
      new URL(getDashboardUrl(userRole), request.url),
    );
  }

  const isPublic = isPublicPath(pathname);
  const isAuth = isAuthPath(pathname);

  if (isAuthenticated && isAuth) {
    return NextResponse.redirect(
      new URL(getDashboardUrl(userRole), request.url),
    );
  }

  if (!isAuthenticated && !isPublic && !isAuth) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && userRole) {
    for (const [path, allowedRoles] of Object.entries(ROLE_RESTRICTED_PATHS)) {
      if (pathname.startsWith(path) && !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(
          new URL(getDashboardUrl(userRole), request.url),
        );
      }
    }
  }

  // Onboarding Guard
  if (
    isAuthenticated &&
    !pathname.startsWith('/onboarding') &&
    !isPublic &&
    needsOnboardingWizard(userRole)
  ) {
    const onboardingStage = request.cookies.get(ONBOARDING_COOKIE)?.value;

    // Force onboarding if stage is explicitly missing or not completed
    // Exceptions for specific admin roles might be needed, but for now we follow the cookie truth
    if (onboardingStage !== 'COMPLETED') {
        const onboardingUrl = new URL('/onboarding', request.url);
        return NextResponse.redirect(onboardingUrl);
    }
  }

  if (pathname.startsWith('/onboarding') && isAuthenticated) {
     const onboardingStage = request.cookies.get(ONBOARDING_COOKIE)?.value;
     if (onboardingStage === 'COMPLETED' || !needsOnboardingWizard(userRole)) {
         return NextResponse.redirect(new URL(getDashboardUrl(userRole), request.url));
     }
  }

  if (pathname.startsWith('/reset-password')) {
    const resetToken = request.nextUrl.searchParams.get('token');
    if (!resetToken) {
      return NextResponse.redirect(new URL('/forgot-password', request.url));
    }
  }

  const response = NextResponse.next();

  if (!isPublic) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  );

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.googleusercontent.com",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self'${API_ORIGIN ? ` ${API_ORIGIN}` : ''}`,
    "frame-src 'self' https://www.google.com",
    "worker-src 'self' blob:",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.png|favicon.ico|robots.txt|sitemap.xml|llms.txt|llms-full.txt|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
