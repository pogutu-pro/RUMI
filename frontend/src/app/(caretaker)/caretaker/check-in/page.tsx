'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Filter, Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getCaretakerDashboard } from '@/features/caretaker';

export default function CheckInListPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Reuse dashboard data for now as it contains upcoming movements
  // In a real app, we'd have a dedicated endpoint for all pending check-ins
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['caretaker', 'dashboard'],
    queryFn: getCaretakerDashboard,
  });

  const checkIns = dashboardData?.upcomingEvents
    .filter((event) => event.type === 'check_in')
    .map((event) => ({
      id: event.id,
      studentName: event.tenant
        ? `${event.tenant.first_name} ${event.tenant.last_name}`
        : event.title,
      roomNumber: event.room || 'TBD',
    })) || [];

  const filteredCheckIns = checkIns.filter(item => 
    item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.roomNumber.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Check-Ins
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            Manage incoming students and process their check-ins
          </p>
        </div>
        <Button asChild>
          <Link href="/caretaker/hostel/check-in/new">
            Process New Check-In
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by student name or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredCheckIns.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending check-ins found matching your search.</p>
          </div>
        ) : (
          filteredCheckIns.map((checkIn) => (
            <Card key={checkIn.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{checkIn.studentName}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Today
                      </span>
                      <span>•</span>
                      <span>Room {checkIn.roomNumber}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/caretaker/hostel/check-in/${checkIn.id}`}>
                    Start Check-In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
