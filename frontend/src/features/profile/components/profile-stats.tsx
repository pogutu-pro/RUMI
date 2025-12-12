'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Star, Calendar, TrendingUp } from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

interface ProfileStatsProps {
  stats?: {
    totalBookings?: number;
    activeBookings?: number;
    totalReviews?: number;
    averageRating?: number;
    memberSince?: string;
  };
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <StatItem
            icon={<Home className="h-5 w-5 text-primary" />}
            label="Total Bookings"
            value={stats?.totalBookings || 0}
          />
          <StatItem
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            label="Active Bookings"
            value={stats?.activeBookings || 0}
          />
          <StatItem
            icon={<Star className="h-5 w-5 text-primary" />}
            label="Average Rating"
            value={stats?.averageRating?.toFixed(1) || 'N/A'}
          />
          <StatItem
            icon={<Calendar className="h-5 w-5 text-primary" />}
            label="Member Since"
            value={stats?.memberSince || 'N/A'}
          />
        </div>
      </CardContent>
    </Card>
  );
}
