"use client";

import * as React from 'react';
import { useState } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  ArrowRight,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isToday, isPast, isFuture, addDays } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useBookings } from '@/hooks/use-bookings';
import Link from 'next/link';
import { useProcessCheckIn } from '@/hooks/use-check-in-out';

export default function CheckInsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, today, upcoming, overdue
  const { data: bookingsData, isLoading } = useBookings({ status: 'confirmed' });
  const checkIns = bookingsData || [];

  // Filter for check-ins
  // Assuming 'confirmed' bookings are those waiting to check in or currently active. 
  // We might need a flag 'checked_in' if status doesn't change to 'active'.
  // For now, we list 'confirmed' bookings sorted by check-in date.
  
  const filteredCheckIns = checkIns.filter((booking) => {
    // Basic search filtering
    const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student';
    const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const checkInDate = new Date(booking.check_in_date);
    
    // Status Filter
    if (filter === 'today') return isToday(checkInDate);
    if (filter === 'upcoming') return isFuture(checkInDate);
    if (filter === 'overdue') return isPast(checkInDate) && !isToday(checkInDate);
    
    return true;
  }).sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const getStatusBadge = (date: Date) => {
    if (isToday(date)) return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Today</Badge>;
    if (isPast(date)) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Overdue</Badge>;
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">Upcoming</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Check-Ins
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage incoming tenant arrivals and key handovers
          </p>
        </div>
        <div className="flex gap-2">
            {/* Quick stats or actions could go here */}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Check-Ins</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-4">
                   <Skeleton className="h-24 w-full rounded-xl" />
                </div>
             ))
        ) : filteredCheckIns.length === 0 ? (
            <Card className="border-none shadow-md">
                <CardContent className="p-12 text-center">
                    <CalendarCheck className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No check-ins found</h3>
                    <p className="text-muted-foreground">No pending check-ins match your criteria.</p>
                </CardContent>
            </Card>
        ) : (
            filteredCheckIns.map((booking, index) => {
                const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student';
                const hostelName = typeof booking.hostel === 'object' ? booking.hostel.name : 'Hostel';
                const roomNumber = typeof booking.room === 'object' ? booking.room.number : (booking.room_number || 'N/A');
                const checkInDate = new Date(booking.check_in_date);

                return (
                <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                    <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-6">
                             {/* Date Badge */}
                             <div className="flex flex-col items-center justify-center h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{format(checkInDate, 'dd')}</span>
                                <span className="text-xs font-medium text-slate-500 uppercase">{format(checkInDate, 'MMM')}</span>
                             </div>

                             {/* Info */}
                             <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{studentName}</h3>
                                    {getStatusBadge(checkInDate)}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <Building2 className="h-4 w-4" />
                                        <span>{hostelName}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <User className="h-4 w-4" />
                                        <span>Room {roomNumber}</span>
                                    </div>
                                </div>
                             </div>

                             {/* Action */}
                             <div className="shrink-0">
                                <Link href={`/landlord/tenants/check-in/${booking.id}`}>
                                    <Button className="gap-2 w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 shadow-md shadow-emerald-900/20">
                                        Start Check-In
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                             </div>
                        </CardContent>
                    </Card>
                </motion.div>
                );
            })
        )}
      </div>
    </div>
  );
}
