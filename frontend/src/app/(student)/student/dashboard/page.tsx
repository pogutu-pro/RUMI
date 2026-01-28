'use client';

import * as React from 'react';
import { useAuth } from '@/features/auth';
import { 
  useRentStatus, 
  useRecentTransactions, 
  useActiveTickets, 
  useActivityFeed 
} from '@/features/student';
import { useMyBooking } from '@/features/bookings/hooks/use-my-booking';
import { StudentWelcomeHero } from '@/features/dashboard/components/student-welcome-hero';
import { SmartActionGrid } from '@/features/dashboard/components/smart-action-grid';
import { RentOverviewCard } from '@/features/dashboard/components/rent-overview-card';
import { CurrentStayCard } from '@/features/dashboard/components/current-stay-card';
import { RecentActivity } from '@/features/dashboard/components/recent-activity';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  
  // Data Fetching
  const { data: currentBooking, isLoading: bookingLoading } = useMyBooking();
  const { data: rentStatus, isLoading: rentLoading } = useRentStatus();
  const { data: activityEvents = [], isLoading: activityLoading } = useActivityFeed(5);

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto">
      {/* 1. Hero Section */}
      <section>
        <StudentWelcomeHero 
          hostelName={(currentBooking?.hostel as any)?.name} 
          roomNumber={(currentBooking?.room as any)?.room_number || (currentBooking?.room as any)?.number || (currentBooking?.room as any)?.roomNumber}
          loading={bookingLoading} 
        />
      </section>

      {/* 2. Quick Actions Grid */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 px-1 opacity-70">Essential Actions</h2>
        <SmartActionGrid />
      </section>

      {/* 3. Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3) - Vital Info */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Status Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[340px]">
            <div className="h-full">
               <RentOverviewCard rentStatus={rentStatus ?? null} loading={rentLoading} />
            </div>
            <div className="h-full">
               <CurrentStayCard booking={currentBooking ?? null} loading={bookingLoading} />
            </div>
          </div>
        </div>

        {/* Right Column (1/3) - Timeline & Updates */}
        <div className="space-y-8">
           {/* Activity Feed */}
           <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 opacity-70 border-b border-border/50 pb-2">Recent Updates</h3>
              <RecentActivity activities={activityEvents} />
           </div>
        </div>
      </div>
    </div>
  );
}
