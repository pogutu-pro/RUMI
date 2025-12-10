// FILE: src/lib/constants/routes.ts
import { UserRole } from '@/types/auth.types';

type RouteValue = string | ((...args: any[]) => string);
type NestedRoutes = { [key: string]: RouteValue | NestedRoutes };
const mark = <T extends NestedRoutes>(t: T) => t;

// -------------------------
// Public routes
// -------------------------
export const PUBLIC_ROUTES = mark({
  HOME: '/',
  ABOUT: '/about',
  PRICING: '/pricing',
  FEATURES: '/features',
  HOW_IT_WORKS: '/how-it-works',
  HOW_IT_WORKS_STUDENTS: '/how-it-works/students',
  HOW_IT_WORKS_LANDLORDS: '/how-it-works/landlords',
  CONTACT: '/contact',
  FAQ: '/faq',
  BLOG: '/blog',
  BLOG_POST: (slug: string) => `/blog/${slug}`,
  HOSTELS: '/hostels',
  HOSTEL_DETAIL: (id: string) => `/hostels/${id}`,
  TERMS: '/terms',
  PRIVACY: '/privacy',
});

// -------------------------
// Auth routes
// -------------------------
export const AUTH_ROUTES = mark({
  LOGIN: '/login',
  REGISTER: '/register',
  REGISTER_STUDENT: (tab = 'student') => `/register?tab=${tab}`,
  REGISTER_LANDLORD: (tab = 'landlord') => `/register?tab=${tab}`,
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: (token = '') =>
    `/reset-password${token ? `?token=${token}` : ''}`,
  VERIFY_EMAIL: '/verify-email',
  VERIFY_PHONE: '/verify-phone',
});

// -------------------------
// Student routes
// -------------------------
export const STUDENT_ROUTES = mark({
  DASHBOARD: '/student/dashboard',
  BOOKINGS: {
    INDEX: '/student/bookings',
    NEW: '/student/bookings/new',
    DETAIL: (id: string) => `/student/bookings/${id}`,
  },
  FAVORITES: '/student/favorites',
  MESSAGES: {
    INDEX: '/student/messages',
    CONVERSATION: (id: string) => `/student/messages/${id}`,
  },
  PAYMENTS: {
    INDEX: '/student/payments',
    METHODS: '/student/payments/methods',
  },
  PROFILE: '/student/profile',
  ROOMMATES: {
    INDEX: '/student/roommates',
    MY_PROFILE: '/student/roommates/my-profile',
    MATCHES: '/student/roommates/matches',
    PROFILE: (userId: string) => `/student/roommates/${userId}`,
    REQUESTS: '/student/roommates/requests',
  },
  ROOM_TRANSFER: '/student/room-transfer',
  TRANSFERS: {
    INDEX: '/student/transfers',
    AVAILABLE: '/student/transfers/available',
    CREATE: '/student/transfers/create',
    DETAIL: (id: string) => `/student/transfers/${id}`,
  },
  REVIEWS: '/student/reviews',
  NOTIFICATIONS: '/student/notifications',
  SUPPORT: {
    INDEX: '/student/support',
    NEW: '/student/support/new',
    DETAIL: (ticketId: string) => `/student/support/${ticketId}`,
  },
});

// -------------------------
// Landlord routes
// -------------------------
export const LANDLORD_ROUTES = mark({
  DASHBOARD: '/landlord/dashboard',
  HOSTELS: {
    INDEX: '/landlord/hostels',
    NEW: '/landlord/hostels/new',
    DETAIL: (id: string) => `/landlord/hostels/${id}`,
    EDIT: (id: string) => `/landlord/hostels/${id}/edit`,
    ROOMS: (id: string) => `/landlord/hostels/${id}/rooms`,
    TRANSFERS: (id: string) => `/landlord/hostels/${id}/transfers`,
    ANALYTICS: (id: string) => `/landlord/hostels/${id}/analytics`,
  },
  BOOKINGS: {
    INDEX: '/landlord/bookings',
    CONFIRMED: '/landlord/bookings/confirmed',
    PENDING: '/landlord/bookings/pending',
    HISTORY: '/landlord/bookings/history',
    DETAIL: (id: string) => `/landlord/bookings/${id}`,
  },
  CARETAKERS: {
    INDEX: '/landlord/caretakers',
    NEW: '/landlord/caretakers/new',
    DETAIL: (id: string) => `/landlord/caretakers/${id}`,
  },
  TENANTS: {
    INDEX: '/landlord/tenants',
    DETAIL: (id: string) => `/landlord/tenants/${id}`,
    CHECK_IN: '/landlord/tenants/check-in',
    CHECK_OUT: '/landlord/tenants/check-out',
  },
  MESSAGES: {
    INDEX: '/landlord/messages',
    CONVERSATION: (id: string) => `/landlord/messages/${id}`,
  },
  PAYMENTS: {
    INDEX: '/landlord/payments',
    PAYOUTS: '/landlord/payments/payouts',
    COMMISSION: '/landlord/payments/commission',
    REPORTS: '/landlord/payments/reports',
  },
  PROFILE: '/landlord/profile',
  EDIT_PROFILE: '/landlord/profile/edit',
  VERIFICATION: '/landlord/profile/verification',
  NOTIFICATIONS: '/landlord/notifications',
  SUPPORT: {
    INDEX: '/landlord/support',
    DETAIL: (id: string) => `/landlord/support/${id}`,
  },
});

// -------------------------
// Caretaker routes
// -------------------------
export const CARETAKER_ROUTES = mark({
  DASHBOARD: '/caretaker/dashboard',
  HOSTEL: '/caretaker/hostel',
  TENANTS: '/caretaker/tenants',
  INVENTORY: {
    CHECK_IN: '/caretaker/inventory/check-in',
    CHECK_OUT: '/caretaker/inventory/check-out',
  },
  DAMAGE_REPORTS: {
    INDEX: '/caretaker/damage-reports',
    NEW: '/caretaker/damage-reports/new',
    DETAIL: (id: string) => `/caretaker/damage-reports/${id}`,
  },
  MAINTENANCE: {
    INDEX: '/caretaker/maintenance',
    DETAIL: (id: string) => `/caretaker/maintenance/${id}`,
  },
  PROFILE: '/caretaker/profile',
});

// -------------------------
// Admin routes
// -------------------------
export const ADMIN_ROUTES = mark({
  DASHBOARD: '/admin/dashboard',
  USERS: '/admin/users',
  HOSTELS: '/admin/hostels',
  BOOKINGS: {
    INDEX: '/admin/bookings',
    DETAIL: (id: string) => `/admin/bookings/${id}`,
  },
  PAYMENTS: {
    INDEX: '/admin/payments',
    COMMISSION: '/admin/payments/commission',
    DISPUTES: '/admin/payments/disputes',
    REFUNDS: '/admin/payments/refunds',
    TAX_REPORTS: '/admin/payments/tax-reports',
  },
  TRANSFERS: {
    INDEX: '/admin/transfers',
    STUDENTS: '/admin/transfers/students',
    LANDLORDS: '/admin/transfers/landlords',
    CARETAKERS: '/admin/transfers/caretakers',
    SUSPENDED: '/admin/transfers/suspended',
  },
  REVIEWS: {
    INDEX: '/admin/reviews',
    FLAGGED: '/admin/reviews/flagged',
  },
  ANALYTICS: {
    INDEX: '/admin/analytics',
    REVENUE: '/admin/analytics/revenue',
  },
  REPORTS: {
    INDEX: '/admin/reports',
    EXPORT: '/admin/reports/export',
  },
  SUPPORT: '/admin/support',
  SETTINGS: {
    INDEX: '/admin/settings',
    PLATFORM: '/admin/settings/platform',
    COMMISSION: '/admin/settings/commission',
    PAYMENT: '/admin/settings/payment',
    NOTIFICATIONS: '/admin/settings/notifications',
  },
});

// -------------------------
// Legal & API routes
// -------------------------
export const LEGAL_ROUTES = mark({
  TERMS: '/legal/terms',
  PRIVACY: '/legal/privacy',
  COOKIES: '/legal/cookies',
});

export const API_ROUTES = mark({
  AUTH: '/api/auth',
  USERS: '/api/users',
  HOSTELS: '/api/hostels',
  ROOMS: '/api/rooms',
  BOOKINGS: '/api/bookings',
  PAYMENTS: '/api/payments',
  ROOMMATES: '/api/roommates',
  TRANSFERS: '/api/transfers',
  MESSAGES: '/api/messages',
  SUPPORT: '/api/support',
  ANALYTICS: '/api/analytics',
  UPLOAD: '/api/upload',
  WEBHOOK: '/api/webhook',
});

// -------------------------
// Route groups
// -------------------------
export const ROUTE_GROUPS = mark({
  PUBLIC: PUBLIC_ROUTES,
  AUTH: AUTH_ROUTES,
  STUDENT: STUDENT_ROUTES,
  LANDLORD: LANDLORD_ROUTES,
  CARETAKER: CARETAKER_ROUTES,
  ADMIN: ADMIN_ROUTES,
  LEGAL: LEGAL_ROUTES,
  API: API_ROUTES,
});

// -------------------------
// Route utilities
// -------------------------
export function buildRoute(
  pathOrFn: string | ((...args: any[]) => string),
  args?: Array<string | number | boolean>,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const base =
    typeof pathOrFn === 'function' ? pathOrFn(...(args ?? [])) : pathOrFn;

  if (!query || Object.keys(query).length === 0) return base;

  const searchParams = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    searchParams.set(k, String(v));
  }
  const queryString = searchParams.toString();
  return queryString ? `${base}?${queryString}` : base;
}

export function getRoute(
  group: keyof typeof ROUTE_GROUPS,
  keyPath: string,
  args?: Array<string | number | boolean>,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const root = (ROUTE_GROUPS as any)[group];
  if (!root) throw new Error(`Route group ${String(group)} not found`);

  const parts = keyPath.split('.');
  let current: any = root;
  for (const p of parts) {
    current = current?.[p];
    if (current === undefined)
      throw new Error(`Route ${group}.${keyPath} not found`);
  }

  if (typeof current === 'function') return buildRoute(current, args, query);
  return buildRoute(current, undefined, query);
}

export function resolveRoute(needle: string) {
  const parts = needle.split('.');
  let current: any = ROUTE_GROUPS;
  for (const p of parts) {
    if (!current) return null;
    current = current[p];
  }
  return current ?? null;
}

export function getDashboardRoute(
  role: UserRole | 'student' | 'landlord' | 'caretaker' | 'admin',
) {
  switch (role) {
    case UserRole.STUDENT:
    case 'student':
      return STUDENT_ROUTES.DASHBOARD;
    case UserRole.LANDLORD:
    case 'landlord':
      return LANDLORD_ROUTES.DASHBOARD;
    case UserRole.CARETAKER:
    case 'caretaker':
      return CARETAKER_ROUTES.DASHBOARD;
    case UserRole.SUPER_ADMIN:
    case UserRole.TECH_SUPPORT_ADMIN:
    case 'admin':
      return ADMIN_ROUTES.DASHBOARD;
    default:
      return PUBLIC_ROUTES.HOME;
  }
}

export default ROUTE_GROUPS;
