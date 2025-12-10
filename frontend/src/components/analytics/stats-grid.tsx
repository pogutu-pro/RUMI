'use client';

import { StatsCard } from './stats-card';
import { Users, Home, DollarSign, TrendingUp } from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';

export function StatsGrid() {
  const { data: analytics } = useAnalytics('30d');

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Users"
        value={analytics?.totalUsers?.toLocaleString() || '0'}
        change={analytics?.userGrowth?.percentage}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
      <StatsCard
        title="Total Hostels"
        value={analytics?.totalHostels || 0}
        icon={<Home className="h-4 w-4 text-muted-foreground" />}
      />
      <StatsCard
        title="Total Bookings"
        value={analytics?.totalBookings || 0}
        change={analytics?.bookingGrowth?.percentage}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      <StatsCard
        title="Total Revenue"
        value={`KES ${(analytics?.totalRevenue || 0).toLocaleString()}`}
        change={analytics?.revenueGrowth?.percentage}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
}
