export interface GrowthMetrics {
  current: number;
  previous: number;
  percentage: number;
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '180d' | '1y' | 'custom';

export interface AnalyticsTrend {
  month: string;
  occupancy: number;
  revenue: number;
  bookings: number;
}

export interface HostelPerformance {
  name: string;
  occupancy: number;
  revenue: number;
  tenants: number;
}

export interface PerformanceMetric {
  metric: string;
  score: number;
  fullMark: number;
}

export interface RevenueDistribution {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}

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
  // Chart data
  trends: AnalyticsTrend[];
  propertyPerformance: HostelPerformance[];
  platformMetrics: PerformanceMetric[];
  revenueDistribution: RevenueDistribution[];
}

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}
