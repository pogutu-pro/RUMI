 import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type UserRole =
  | 'student'
  | 'landlord'
  | 'caretaker'
  | 'super_admin'
  | 'tech_support_admin';

const TOKEN_COOKIE = 'rumi_access_token';
const ROLE_COOKIE = 'rumi_user_role';

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
]);

const AUTH_ROUTES = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

const PUBLIC_PREFIXES = [
  '/blog',
  '/hostels',
  '/legal',
  '/verify-email',
  '/verify-phone',
];

const ROLE_RESTRICTED_PATHS: Record<string, UserRole[]> = {
  '/roommates': ['student'],
  '/tenants': ['landlord'],
  '/properties': ['landlord', 'caretaker'],
  '/admin': ['super_admin'],
  '/tech-support': ['tech_support_admin'],
};

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthPath(pathname: string): boolean {
  return AUTH_ROUTES.has(pathname);
}

function getDashboardUrl(role?: UserRole): string {
  switch (role) {
    case 'landlord':
      return '/landlord/dashboard';
    case 'caretaker':
      return '/caretaker/dashboard';
    case 'super_admin':
      return '/admin/dashboard';
    case 'tech_support_admin':
      return '/tech-support/dashboard';
    case 'student':
    default:
      return '/student/dashboard';
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const userRole = request.cookies.get(ROLE_COOKIE)?.value as
    | UserRole
    | undefined;
  const isAuthenticated = !!token;

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

  if (pathname.startsWith('/reset-password')) {
    const resetToken = request.nextUrl.searchParams.get('token');
    if (!resetToken) {
      return NextResponse.redirect(new URL('/forgot-password', request.url));
    }
  }

  const response = NextResponse.next();

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
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
