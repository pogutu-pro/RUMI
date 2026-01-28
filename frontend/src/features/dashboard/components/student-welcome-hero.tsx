'use client';

import * as React from 'react';
import { useAuth } from '@/features/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, CalendarDays, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentWelcomeHeroProps {
  hostelName?: string;
  roomNumber?: string;
  loading?: boolean;
}

export function StudentWelcomeHero({ hostelName, roomNumber, loading }: StudentWelcomeHeroProps) {
  const { user } = useAuth();
  
  const displayName = React.useMemo(() => {
    if (!user) return 'Student';
    if (user.first_name) return user.first_name;
    return user.email.split('@')[0];
  }, [user]);

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Hello';
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="flex items-center gap-6 p-8 rounded-2xl bg-muted/20 animate-pulse border border-border/50">
        <Skeleton className="h-20 w-20 rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm p-8 md:p-10">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        
        {/* Left Section: User Identity */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 flex-1">
          <div className="relative">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 rounded-2xl border-2 border-background shadow-md">
                <AvatarImage 
                    src={user?.profile_picture || user?.avatar} 
                    className="object-cover" 
                    alt={displayName}
                />
                <AvatarFallback className="text-3xl bg-primary/5 text-primary font-semibold">
                  {displayName[0]}
                </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="text-center md:text-left space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                <CalendarDays className="h-3.5 w-3.5" />
                {currentDate}
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                {greeting}, <span className="text-primary">{displayName}</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base font-medium">
                Welcome to your dashboard.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
              {hostelName ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border/50">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground/80">
                        {hostelName} <span className="text-muted-foreground/30 mx-1">•</span> Room {roomNumber}
                    </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-700">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Pending Booking</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Quick Summary or Metric */}
        <div className="hidden lg:flex flex-col items-end justify-center self-stretch border-l border-border/50 pl-8">
            <div className="text-right space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Resident Since</span>
                <p className="text-lg font-bold text-foreground">Jan 2026</p>
            </div>
        </div>

      </div>
    </div>
  );
}
