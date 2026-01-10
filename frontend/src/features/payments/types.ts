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
  status: 'completed' | 'pending' | 'failed' | 'success' | 'pending_stk_push' | 'cancelled';
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
  name?: string;
  details: any;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
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

export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currency: string;
  recipient: string;
  createdAt: string;
  scheduledDate?: string;
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

// M-Pesa Specific Types
export interface MpesaInitializeRequest {
  booking_id: number | string;
  payment_type: 'initial' | 'late_fee';
  payment_method: 'stk_push';
  phone_number: string;
  late_fee_id?: number | string;
}

export interface MpesaInitializeResponse {
  transaction_id: number;
  transaction_reference: string;
  amount: number;
  payment_method: string;
  mpesa_payment_type: string;
  phone_number: string;
  checkout_request_id: string;
  merchant_request_id: string;
  status: string;
  message: string;
  c2b_alternative: {
    note: string;
    business_number: string;
    amount: string;
    reference: string;
  };
}

export interface MpesaPaymentStatusResponse {
  transaction: Transaction;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  last_updated: string;
}

export interface MpesaConfig {
  id: number;
  payment_type: 'till_number' | 'paybill_number' | 'pochi_la_biashara' | 'send_money';
  mpesa_number: string;
  business_name: string;
  is_default: boolean;
  status: 'active' | 'inactive';
  verified_at: string | null;
}

export interface CreateMpesaConfigRequest {
  payment_type: MpesaConfig['payment_type'];
  mpesa_number: string;
  business_name: string;
  is_default?: boolean;
}

export interface PaymentInitializeRequest {
  bookingId: string | number;
  method: 'mpesa' | 'bank';
  phoneNumber?: string;
  amount?: number;
}



