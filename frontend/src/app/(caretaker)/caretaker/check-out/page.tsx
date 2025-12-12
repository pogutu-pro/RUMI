'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Filter, Calendar, User, ArrowRight, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getCaretakerDashboard } from '@/features/caretaker';

export default function CheckOutListPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Reuse dashboard data for now
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['caretaker', 'dashboard'],
    queryFn: getCaretakerDashboard,
  });

  const checkOuts = dashboardData?.upcomingEvents
    .filter((event) => event.type === 'check_out')
    .map((event) => ({
      id: event.id,
      studentName: event.tenant
        ? `${event.tenant.first_name} ${event.tenant.last_name}`
        : event.title,
      roomNumber: event.room || 'TBD',
    })) || [];

  const filteredCheckOuts = checkOuts.filter(item => 
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
            Check-Outs
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            Process student departures and room clearances
          </p>
        </div>
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
        {filteredCheckOuts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <LogOut className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending check-outs found matching your search.</p>
          </div>
        ) : (
          filteredCheckOuts.map((checkOut) => (
            <Card key={checkOut.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{checkOut.studentName}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Today
                      </span>
                      <span>•</span>
                      <span>Room {checkOut.roomNumber}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/caretaker/hostel/check-out/${checkOut.id}`}>
                    Process Check-Out
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
