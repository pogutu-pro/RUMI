import { Hostel } from '@/features/hostels/types';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  interval: 'monthly' | 'yearly';
  description?: string;
}

export interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

export interface Payment {
  id: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: Date;
  user: {
    name: string;
    email: string;
  };
  method: string;
  reference: string;
  type: 'rent' | 'deposit' | 'fee';
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'rent' | 'deposit' | 'penalty' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  method: string;
  reference: string;
  description?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'mpesa' | 'bank' | 'card';
  label: string;
  details: string;
  isDefault: boolean;
  createdAt: string;
}

export interface RecurringPayment {
  id: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'biweekly';
  nextPaymentDate: string;
  status: 'active' | 'paused' | 'cancelled';
  paymentMethod: PaymentMethod;
}

export interface RentStatusInfo {
  status: 'paid' | 'due_soon' | 'overdue';
  nextPaymentDate: string;
  daysUntilDue: number;
  totalOutstanding: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
}

export interface PaymentStats {
  totalRevenue: number;
  availableBalance: number;
  pendingAmount: number;
  failedAmount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
}


