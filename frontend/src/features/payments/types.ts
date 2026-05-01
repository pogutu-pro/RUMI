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
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  current_period_end?: string;
}

export interface Payment {
  id: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'success' | 'cancelled' | 'processing';
  date: string;
  user: {
    name: string;
    email: string;
  };
  method: string;
  reference: string;
  type: 'rent' | 'deposit' | 'fee' | 'wallet_credit';
  rent_period?: number;
}

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: 'rent' | 'deposit' | 'penalty' | 'refund' | 'wallet_credit';
  status: 'success' | 'pending' | 'failed' | 'processing';
  method: string;
  reference: string;
  description?: string;
  metadata?: any;
  paid_at?: string;
  rent_period?: number;
  rent_period_details?: {
    id: number;
    start_date: string;
    end_date: string;
    status: string;
    bed_code: string;
  };
  booking?: number;
  booking_details?: {
    id: number;
    room: string;
    hostel: string;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'bank' | 'card';
  label: string;
  name?: string;
  details: any;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RentPeriod {
  id: number;
  student: number;
  student_details: {
    id: number;
    name: string;
    email: string;
  };
  hostel: number;
  hostel_details: {
    id: number;
    name: string;
    address: string;
  };
  room?: number;
  room_details?: {
    id: number;
    room_number: string;
    room_type: string;
  };
  booking: number;
  bed?: string;
  bed_details?: {
    id: string;
    code: string;
    full_code: string;
    bed_type: string;
  };
  bed_slot_id: string;
  start_date: string;
  end_date: string;
  amount_due: number;
  amount_paid: number;
  balance: number;
  status: 'due' | 'partially_paid' | 'paid' | 'overdue' | 'transferred';
  transactions: Array<{
    id: number;
    reference: string;
    amount: number;
    payment_method: string;
    status: string;
    paid_at: string | null;
  }>;
  created_at: string;
  updated_at: string;
}

export interface StudentWallet {
  id: number;
  student: number;
  student_details: {
    id: number;
    name: string;
    email: string;
  };
  balance: number;
  updated_at: string;
}

export interface TransferLog {
  id: number;
  student: number;
  student_details: { id: number; name: string; email: string };
  amount: number;
  reason: string;
  created_at: string;
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

export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  reference: string;
  created_at: string;
  processed_at?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason: string;
}

export interface Refund {
  id: string;
  transactionId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  reason: string;
  createdAt: string;
}

export interface PaymentInitializeRequest {
  bookingId: string | number;
  rentPeriodId?: string | number;
  method: 'paystack';
  phoneNumber?: string;
  amount?: number;
}




export interface SubscriptionInvoice {
  id: string;
  hostel: string;
  hostel_name: string;
  landlord: number;
  subscription_plan: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  period_start: string;
  period_end: string;
  total_bed_days: number;
  average_occupancy: number;
  unit_price: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'issued' | 'paid' | 'overdue' | 'cancelled' | 'in_grace';
  paid_at: string | null;
  payment_transaction: number | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionAccrual {
  period_start: string;
  as_of: string;
  total_occupied_bed_days: number;
  projected_accrual: number;
  currency: string;
  hostel_breakdown: Array<{
    hostel__name: string;
    bed_days: number;
  }>;
}

export interface SubscriptionPayment {
  id: string;
  subscription: string;
  subscription_details: {
    plan_name: string;
    plan_type: string;
  };
  amount: number;
  billing_period_start: string;
  billing_period_end: string;
  period_display: string;
  rent_revenue_amount: number | null;
  payment_method: string;
  transaction_reference: string;
  paystack_reference: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  status_display: string;
  initiated_at: string;
  paid_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
}

export interface InitiatePaymentResponse {
  payment_id: string;
  transaction_reference: string;
  amount: number;
  payment_link: string;
  currency: string;
  expires_at: string;
}
