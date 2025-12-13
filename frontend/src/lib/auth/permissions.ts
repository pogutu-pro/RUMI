// FILE: src/lib/auth/permissions.ts

import { UserRole } from '@/features/auth';

export enum Permission {
  VIEW_HOSTELS = 'view_hostels',
  CREATE_HOSTEL = 'create_hostel',
  UPDATE_HOSTEL = 'update_hostel',
  DELETE_HOSTEL = 'delete_hostel',
  APPROVE_HOSTEL = 'approve_hostel',

  VIEW_BOOKINGS = 'view_bookings',
  CREATE_BOOKING = 'create_booking',
  APPROVE_BOOKING = 'approve_booking',
  CANCEL_BOOKING = 'cancel_booking',

  VIEW_PAYMENTS = 'view_payments',
  PROCESS_PAYMENT = 'process_payment',
  ISSUE_REFUND = 'issue_refund',
  VIEW_PAYOUTS = 'view_payouts',

  VIEW_USERS = 'view_users',
  UPDATE_USER = 'update_user',
  SUSPEND_USER = 'suspend_user',
  DELETE_USER = 'delete_user',

  VIEW_INVENTORY = 'view_inventory',
  UPDATE_INVENTORY = 'update_inventory',
  APPROVE_CHECKOUT = 'approve_checkout',

  VIEW_REVIEWS = 'view_reviews',
  MODERATE_REVIEWS = 'moderate_reviews',
  DELETE_REVIEW = 'delete_review',

  VIEW_ANALYTICS = 'view_analytics',
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'export_data',
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    Permission.VIEW_HOSTELS,
    Permission.CREATE_BOOKING,
    Permission.VIEW_BOOKINGS,
    Permission.CANCEL_BOOKING,
    Permission.VIEW_PAYMENTS,
    Permission.PROCESS_PAYMENT,
    Permission.VIEW_REVIEWS,
  ],

  landlord: [
    Permission.VIEW_HOSTELS,
    Permission.CREATE_HOSTEL,
    Permission.UPDATE_HOSTEL,
    Permission.DELETE_HOSTEL,
    Permission.VIEW_BOOKINGS,
    Permission.APPROVE_BOOKING,
    Permission.CANCEL_BOOKING,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_PAYOUTS,
    Permission.VIEW_INVENTORY,
    Permission.UPDATE_INVENTORY,
    Permission.VIEW_REVIEWS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_REPORTS,
  ],

  caretaker: [
    Permission.VIEW_HOSTELS,
    Permission.VIEW_BOOKINGS,
    Permission.VIEW_INVENTORY,
    Permission.UPDATE_INVENTORY,
    Permission.APPROVE_CHECKOUT,
  ],

  tech_support: [
    Permission.VIEW_HOSTELS,
    Permission.VIEW_BOOKINGS,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_REVIEWS,
    Permission.VIEW_REPORTS,
  ],

  tech_support_admin: [
    Permission.VIEW_HOSTELS,
    Permission.APPROVE_HOSTEL,
    Permission.VIEW_BOOKINGS,
    Permission.VIEW_PAYMENTS,
    Permission.ISSUE_REFUND,
    Permission.VIEW_USERS,
    Permission.UPDATE_USER,
    Permission.SUSPEND_USER,
    Permission.VIEW_REVIEWS,
    Permission.MODERATE_REVIEWS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
  ],

  super_admin: Object.values(Permission),
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}
