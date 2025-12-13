"use client";

import * as React from 'react';
import { useState } from 'react';
import {
  LogOut,
  Search,
  Filter,
  ArrowRight,
  User,
  Building2,
  Calendar,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isToday, isPast, isFuture, addDays, differenceInDays } from 'date-fns';

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
import { cn } from '@/lib/utils';
import { useBookings } from '@/features/bookingss';
import Link from 'next/link';

export default function CheckOutsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, today, upcoming
  const { data: bookingsData, isLoading } = useBookings({ status: 'confirmed' }); // Using confirmed (active) items
  const bookings = bookingsData || [];

  // Filter for check-outs
  // We look for 'confirmed' bookings where lease is ending or has ended.
  // Assuming 'booking.check_out_date' or 'lease_end_date' field exists.
  // Bookings usually have check_in_date and duration (months), or end_date.
  // "Booking" type (entities.types.ts) should have duration.
  
  const checkOuts = bookings.map(b => {
      // Calculate end date based on duration (months)
      const startDate = new Date(b.check_in_date);
      const durationMonths = Number(b.duration || 1);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);
      return { ...b, endDate };
  });

  const filteredCheckOuts = checkOuts.filter((booking) => {
    const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student';
    const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filter logic: show checkouts happening soon (e.g. within 30 days) or overdue
    const daysUntilEnd = differenceInDays(booking.endDate, new Date());
    
    // We only care about checkouts that are "relevant" (not years in future, unless listing all)
    // For 'upcoming', maybe next 30 days.
    
    if (filter === 'today') return isToday(booking.endDate);
    if (filter === 'upcoming') return isFuture(booking.endDate) && daysUntilEnd <= 30;
    if (filter === 'overdue') return isPast(booking.endDate);
    
    return true; 
  }).sort((a, b) => a.endDate.getTime() - b.endDate.getTime());

  const getStatusBadge = (date: Date) => {
    if (isToday(date)) return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0">Ending Today</Badge>;
    if (isPast(date)) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Lease Expired</Badge>;
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">{differenceInDays(date, new Date())} Days Left</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <LogOut className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            Check-Outs
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Monitor lease expiries and process tenant departures
          </p>
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
                <SelectItem value="all">All Check-Outs</SelectItem>
                <SelectItem value="today">Ending Today</SelectItem>
                <SelectItem value="upcoming">Upcoming (30 days)</SelectItem>
                <SelectItem value="overdue">Expired</SelectItem>
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
        ) : filteredCheckOuts.length === 0 ? (
            <Card className="border-none shadow-md">
                <CardContent className="p-12 text-center">
                    <ClipboardList className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No check-outs found</h3>
                    <p className="text-muted-foreground">No leases match your criteria.</p>
                </CardContent>
            </Card>
        ) : (
            filteredCheckOuts.map((booking, index) => {
                const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student';
                const hostelName = typeof booking.hostel === 'object' ? booking.hostel.name : 'Hostel';
                const roomNumber = typeof booking.room === 'object' ? booking.room.number : (booking.room_number || 'N/A');

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
                                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{format(booking.endDate, 'dd')}</span>
                                <span className="text-xs font-medium text-slate-500 uppercase">{format(booking.endDate, 'MMM')}</span>
                             </div>

                             {/* Info */}
                             <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{studentName}</h3>
                                    {getStatusBadge(booking.endDate)}
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
                                <Link href={`/landlord/tenants/check-out/${booking.id}`}>
                                    <Button variant="outline" className="gap-2 w-full sm:w-auto border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-900 dark:hover:bg-orange-900/20">
                                        Process Departure
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
