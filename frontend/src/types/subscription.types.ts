export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  interval: 'monthly' | 'yearly';
}

export interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}
