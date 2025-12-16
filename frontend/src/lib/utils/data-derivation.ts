import type { UserSubscription } from '@/features/payments/types';

/**
 * Data Derivation Utilities
 * 
 * These utilities derive frontend-friendly data from existing backend responses,
 * eliminating the need for dedicated "missing" endpoints.
 */

export interface RentStatus {
  status: 'paid' | 'pending' | 'overdue';
  nextPaymentDate: string;
  daysUntilDue: number;
  totalOutstanding: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
}

/**
 * Derive rent status from subscription data
 * USE INSTEAD OF: GET /payments/rent-status/
 * ACTUAL ENDPOINT: GET /accounts/subscriptions/my-subscription/
 */
export function deriveRentStatus(subscription: UserSubscription | null): RentStatus {
  if (!subscription) {
    return {
      status: 'pending',
      nextPaymentDate: '',
      daysUntilDue: 0,
      totalOutstanding: 0,
      lastPaymentDate: null,
      lastPaymentAmount: null,
    };
  }

  const now = new Date();
  const nextDate = new Date(subscription.endDate || '');
  const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let status: 'paid' | 'pending' | 'overdue' = 'paid';
  if (subscription.status === 'cancelled' || subscription.status === 'expired') {
    status = 'pending';
  } else if (daysUntil < 0) {
    status = 'overdue';
  } else if (daysUntil < 7) {
    status = 'pending';
  }

  return {
    status,
    nextPaymentDate: subscription.endDate || '',
    daysUntilDue: daysUntil,
    totalOutstanding: status !== 'paid' ? (subscription.plan?.price || 0) : 0,
    lastPaymentDate: subscription.startDate || null,
    lastPaymentAmount: subscription.plan?.price || null,
  };
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
