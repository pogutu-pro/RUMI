export interface GrowthMetrics {
  current: number;
  previous: number;
  percentage: number;
}

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PlatformAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalHostels: number;
  totalBookings: number;
  totalRevenue: number;
  userGrowth: GrowthMetrics;
  bookingGrowth: GrowthMetrics;
  revenueGrowth: GrowthMetrics;
  period: AnalyticsPeriod;
}
