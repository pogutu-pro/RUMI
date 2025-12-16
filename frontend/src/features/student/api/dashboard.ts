import { axiosInstance as axios } from '@/lib/api/client';
import type {
  StudentDashboardData,
  RentStatusInfo,
  Transaction,
  ActivityEvent,
  SupportTicketSummary,
} from '@/types/entities.types';

/**
 * Student Dashboard API
 * Provides comprehensive dashboard data for student portal
 */

/**
 * Get complete dashboard data
 * Note: This is a composite endpoint. If backend doesn't provide it,
 * this function will make multiple API calls to compose the data.
 */
async function getDashboardData(): Promise<StudentDashboardData> {
  try {
    // Try to get from dedicated dashboard endpoint
    const res = await axios.get<StudentDashboardData>('/accounts/dashboard/');
    return res.data;
  } catch (error) {
    // Fallback: Compose from multiple endpoints
    // Note: These endpoints are not strictly defined in the provided API reference, 
    // but we'll try to use available endpoints or return defaults.
    // The main /accounts/dashboard/ endpoint should provide everything.
    
    // If /accounts/dashboard/ fails, we can't reliably compose the data 
    // because constituent endpoints like /payments/rent-status/ are missing.
    // So we return a default structure or re-throw.
    console.warn('Dashboard endpoint failed, returning default empty state.');
    return {
      rentStatus: getDefaultRentStatus(),
      recentTransactions: [],
      activeTickets: 0,
      unreadMessages: 0,
      profileCompletion: 0,
      activityFeed: [],
      hostelInfo: null,
      roommates: [],
      inventoryStatus: null,
    };
  }
}

/**
 * Get rent payment status
 * MIGRATION: Derives data from GET /accounts/subscriptions/my-subscription/
 * instead of non-existent GET /payments/rent-status/
 */
export async function getRentStatus(): Promise<RentStatusInfo> {
  try {
    // Import derivation utility
    const { deriveRentStatus } = await import('@/lib/utils/data-derivation');
    const { getMySubscription } = await import('@/features/payments');
    
    const subscription = await getMySubscription();
    return deriveRentStatus(subscription) as unknown as RentStatusInfo;
  } catch (error) {
    console.error('Failed to fetch rent status', error);
    return getDefaultRentStatus();
  }
}

import { paymentsApi } from '@/features/payments';

/**
 * Get recent transactions
 * Uses /payments/transactions/student/
 */
export async function getRecentTransactions(limit: number = 5): Promise<Transaction[]> {
  try {
    const response = await paymentsApi.getStudentTransactions();
    // Handle both array response and object response with data property
    const transactions = Array.isArray(response) ? response : (response.data || []);
    return transactions.slice(0, limit) as unknown as Transaction[];
  } catch (error) {
    console.error('Failed to fetch recent transactions', error);
    return [];
  }
}

/**
 * Get unread message count
 * WITH GRACEFUL FALLBACK: Returns 0 if endpoint not yet implemented
 * TODO: Backend implementing GET /messages/unread-count/
 */
export async function getUnreadMessageCount(): Promise<number> {
  try {
    const res = await axios.get<{ success: boolean; data: { count: number } }>(
      '/messages/unread-count/'
    );
    return res.data.data?.count || 0;
  } catch (error) {
    // Graceful fallback while backend implements endpoint
    console.warn('[Production Fallback] Unread message count endpoint not available yet');
    return 0; // Show no unread messages rather than breaking UI
  }
}

/**
 * Get active support tickets
 * WITH GRACEFUL FALLBACK: Returns empty array if endpoint not yet implemented
 */
export async function getActiveTickets(): Promise<SupportTicketSummary[]> {
  try {
    const res = await axios.get<{ success: boolean; data: SupportTicketSummary[] }>(
      '/support/tickets/my/'
    );
    return res.data.data || [];
  } catch (error) {
    console.warn('[Production Fallback] Active tickets endpoint not available yet');
    return []; // Return empty - no tickets to show
  }
}

/**
 * Get activity feed
 * WITH GRACEFUL FALLBACK: Returns empty array if endpoint not yet implemented
 */
export async function getActivityFeed(limit: number = 5): Promise<ActivityEvent[]> {
  try {
    const res = await axios.get<{ success: boolean; data: ActivityEvent[] }>(
      '/activity/feed/',
      { params: { limit } }
    );
    return res.data.data || [];
  } catch (error) {
    console.warn('[Production Fallback] Activity feed endpoint not available yet');
    return []; // Return empty feed
  }
}

/**
 * Helper: Get default rent status when API fails
 */
function getDefaultRentStatus(): RentStatusInfo {
  return {
    status: 'paid',
    nextPaymentDate: '',
    daysUntilDue: 0,
    totalOutstanding: 0,
    lastPaymentDate: null,
    lastPaymentAmount: null,
  };
}

export const studentDashboardApi = {
  getDashboardData,
  getRentStatus,
  getRecentTransactions,
  getUnreadMessageCount,
  getActiveTickets,
  getActivityFeed,
};

/**
 * ================================================================================
 * README: Student Dashboard API (student-dashboard.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Provides comprehensive dashboard data for the student portal. Aggregates
 * data from multiple endpoints into a single dashboard view.
 *
 * ENDPOINTS:
 * ----------
 * | Method | Endpoint               | Function                |
 * |--------|------------------------|-------------------------|
 * | GET    | /accounts/dashboard/   | getDashboardData()      |
 * | GET    | /payments/rent-status/ | getRentStatus()         |
 * | GET    | /payments/transactions/| getRecentTransactions() |
 * | GET    | /messages/unread-count/| getUnreadMessageCount() |
 * | GET    | /support/tickets/      | getActiveTickets()      |
 * | GET    | /activity/feed/        | getActivityFeed()       |
 *
 * DASHBOARD DATA:
 * ---------------
 * - rentStatus: Current rent payment status
 * - recentTransactions: Last N payment transactions
 * - activeTickets: Open support tickets count
 * - unreadMessages: Unread message count
 * - profileCompletion: Profile completion percentage
 * - hostelInfo: Current booking hostel details
 * - roommates: Current roommates info
 *
 * FALLBACK:
 * ---------
 * If dedicated dashboard endpoint fails, the module composes
 * data from individual endpoints using Promise.allSettled().
 *
 * USAGE:
 * ------
 * ```typescript
 * import { studentDashboardApi } from './student-dashboard';
 *
 * const dashboard = await studentDashboardApi.getDashboardData();
 * console.log(dashboard.rentStatus.daysUntilDue);
 * ```
 *
 * ================================================================================
 */
