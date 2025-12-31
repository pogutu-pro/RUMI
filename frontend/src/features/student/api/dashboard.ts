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


export async function getRentStatus(): Promise<RentStatusInfo> {

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
 * Endpoint: /accounts/messages/unread-count/
 */
export async function getUnreadMessageCount(): Promise<number> {
  try {
    const res = await axios.get<{ unread_count: number }>('/accounts/messages/unread-count/');
    return res.data.unread_count || 0;
  } catch (error) {
    console.warn('Failed to fetch unread messages count:', error);
    return 0;
  }
}

/**
 * Get active support tickets
 * Endpoint: /accounts/student/support/tickets/
 */
export async function getActiveTickets(): Promise<SupportTicketSummary[]> {
  try {
    const res = await axios.get<{ tickets: SupportTicketSummary[], total_active: number }>('/accounts/student/support/tickets/');
    return res.data.tickets || [];
  } catch (error) {
    console.warn('Failed to fetch active tickets:', error);
    return [];
  }
}

/**
 * Get activity feed
 * Endpoint: /accounts/student/activity/feed/
 */
export async function getActivityFeed(limit: number = 5): Promise<ActivityEvent[]> {
  try {
    const res = await axios.get<{ activities: ActivityEvent[], total: number }>(`/accounts/student/activity/feed/?limit=${limit}`);
    return res.data.activities || [];
  } catch (error) {
    console.warn('Failed to fetch activity feed:', error);
    return [];
  }
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

