import { RentStatusInfo, Transaction } from '@/features/payments/types';
import { HostelInfo } from '@/features/hostels/types';
import { RoommateSnapshot } from '@/features/roommates/types';
import { InventoryStatusSummary } from '@/features/inventory/types';

export interface StudentDashboardData {
  rentStatus: RentStatusInfo;
  profileCompletion: number;
  unreadMessages: number;
  activeTickets: number;
  recentTransactions: Transaction[];
  activityFeed: ActivityEvent[];
  hostelInfo: HostelInfo | null;
  roommates: RoommateSnapshot[];
  inventoryStatus: InventoryStatusSummary | null;
}

export interface ActivityEvent {
  id: string;
  type: 'invoice' | 'payment' | 'message' | 'roommate' | 'ticket' | 'booking' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  actionUrl?: string;
}
