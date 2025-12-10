'use client';

import { StatsGrid } from './stats-grid';
import { BookingTrendsChart } from './booking-trends-chart';
import { RevenueChart } from './revenue-chart';
import { OccupancyChart } from './occupancy-chart';
import { UserGrowthChart } from './user-growth-chart';
import { PaymentSuccessRateChart } from './payment-success-rate-chart';
import { DateRangeSelector } from './date-range-selector';

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
        <DateRangeSelector />
      </div>

      <StatsGrid />

      <div className="grid gap-6 md:grid-cols-2">
        <BookingTrendsChart />
        <RevenueChart />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <OccupancyChart />
        <UserGrowthChart />
      </div>

      <PaymentSuccessRateChart />
    </div>
  );
}
