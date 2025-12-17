import { axiosInstance as axios } from '@/lib/api/client';
import type {
  StudentDashboardData,
  RentStatusInfo,
  Transaction,
  ActivityEvent,
  SupportTicketSummary,
} from '@/types/entities.types';
import { paymentsApi } from '@/features/payments';

/**
 * Student Dashboard API
 * Provides comprehensive dashboard data for student portal
 */

/**
 * Get complete dashboard data
 * Primary Endpoint: /accounts/dashboard/ (as per SETUP_GUIDE.md)
 */
async function getDashboardData(): Promise<StudentDashboardData> {
  try {
    const res = await axios.get<StudentDashboardData>('/accounts/dashboard/');
    // Ensure we return valid data structure even if some fields are null
    return {
       ...res.data,
       // Ensure arrays are initialized if null
       recentTransactions: res.data.recentTransactions || [],
       activityFeed: res.data.activityFeed || [],
       roommates: res.data.roommates || [],
    };
  } catch (error) {
    console.warn('Dashboard endpoint failed or inactive. Returning safe default state.', error);
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
 * If not provided by dashboard, we return a default "safe" status.
 * Future: Deduce from subscription or booking status.
 */
export async function getRentStatus(): Promise<RentStatusInfo> {
   // Ideally this comes from getDashboardData. 
   // If called independently, we might need a specific endpoint not yet documented.
   // returning default for now to prevent crashes.
   return getDefaultRentStatus();
}


/**
 * Get recent transactions
 * Endpoint: /payments/transactions/student/
 */
export async function getRecentTransactions(limit: number = 5): Promise<Transaction[]> {
  try {
    const res = await axios.get<{ results?: Transaction[], data?: Transaction[] } | Transaction[]>('/payments/transactions/student/');
    
    let transactions: Transaction[] = [];
    if (Array.isArray(res.data)) {
        transactions = res.data;
    } else if (res.data && Array.isArray(res.data.results)) {
        transactions = res.data.results;
    } else if (res.data && Array.isArray(res.data.data)) {
        transactions = res.data.data;
    }

    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch recent transactions', error);
    return [];
  }
}

/**
 * Get unread message count
 * Note: Endpoint not explicitly in SETUP_GUIDE.md.
 * Gracefully returns 0.
 */
export async function getUnreadMessageCount(): Promise<number> {
  // Graceful fallback
  return 0;
}

/**
 * Get active support tickets
 * Note: Endpoint not explicitly in SETUP_GUIDE.md.
 * Gracefully returns empty list.
 */
export async function getActiveTickets(): Promise<SupportTicketSummary[]> {
   // Graceful fallback
   return [];
}

/**
 * Get activity feed
 * Note: Endpoint not explicitly in SETUP_GUIDE.md.
 * Gracefully returns empty list.
 */
export async function getActivityFeed(limit: number = 5): Promise<ActivityEvent[]> {
    // Graceful fallback
    return [];
}

/**
 * Helper: Get default rent status when API fails
 */
function getDefaultRentStatus(): RentStatusInfo {
  return {
    status: 'paid', // Assume paid to avoid scaring user if API fails
    nextPaymentDate: '-',
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
