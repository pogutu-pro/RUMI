"use client";

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Building2,
  DollarSign,
  Eye,
  Check,
  X,
  MoreVertical,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { useBookings } from '@/features/bookings';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { data: bookingsData, isLoading } = useBookings({ status: 'all' });
  const bookings = bookingsData || [];

  const filteredBookings = bookings.filter((booking) => {
    // Determine searchable fields safely
    const reference = booking.reference || `BKG-${booking.id}`;
    const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student';
    // If hostel is just ID, we can't search by name here easily without more data. Limiting search to ref/student/room for now or checks
    const hostelName = typeof booking.hostel === 'object' ? booking.hostel.name : '';
    // Assuming room might be nested
    const roomNumber = typeof booking.room === 'object' ? booking.room.number : (booking.room_number || '');
    
    const matchesSearch =
      reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    // API status might be lowercase, tab is lowercase
    const matchesTab = activeTab === 'all' || booking.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
      case 'pending':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return CheckCircle2;
      case 'pending':
        return Clock;
      case 'cancelled':
        return XCircle;
      case 'completed':
        return Calendar;
      default:
        return Calendar;
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Booking Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage bookings and reservations across all properties
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Bookings</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
                <CalendarCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-950/30">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Confirmed</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completed}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by reference, student, hostel, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({stats.confirmed})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-4">
                  <Skeleton className="h-40 w-full rounded-xl" />
                </div>
            ))
          ) : (
          filteredBookings.map((booking, index) => {
            const StatusIcon = getStatusIcon(booking.status);
            // Safe accessors assuming booking can be complex
            const reference = booking.reference || `BKG-${booking.id}`;
            const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student Name';
            const hostelName = typeof booking.hostel === 'object' ? booking.hostel.name : 'Hostel';
            const roomNumber = typeof booking.room === 'object' ? booking.room.number : (booking.room_number || 'N/A');
            const checkInDate = booking.check_in_date ? new Date(booking.check_in_date) : new Date();
            const createdAt = booking.created_at ? new Date(booking.created_at) : new Date();
            
            // Handle numeric fields that might be strings
            const duration = Number(booking.duration || 1);
            const monthlyRent = Number(booking.monthly_rent || 0); // Assuming snake_case
            const totalAmount = Number(booking.total_amount || 0);

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      {/* Booking Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn(
                          'p-4 rounded-lg',
                          booking.status === 'confirmed' ? 'bg-green-100 dark:bg-green-950/30' :
                          booking.status === 'pending' ? 'bg-orange-100 dark:bg-orange-950/30' :
                          booking.status === 'cancelled' ? 'bg-red-100 dark:bg-red-950/30' :
                          'bg-blue-100 dark:bg-blue-950/30'
                        )}>
                          <StatusIcon className={cn(
                            'h-6 w-6',
                            booking.status === 'confirmed' ? 'text-green-600 dark:text-green-400' :
                            booking.status === 'pending' ? 'text-orange-600 dark:text-orange-400' :
                            booking.status === 'cancelled' ? 'text-red-600 dark:text-red-400' :
                            'text-blue-600 dark:text-blue-400'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              {reference}
                            </h3>
                            <Badge className={cn('border-0', getStatusColor(booking.status))}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{studentName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              <span>{hostelName} - Room {roomNumber}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Check-in: {format(checkInDate, 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                            Created {format(createdAt, 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {duration}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Months</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            KES {(monthlyRent / 1000).toFixed(0)}K
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Monthly</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            KES {(totalAmount / 1000).toFixed(0)}K
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Total</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                              <Check className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-2">
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Link href={`/landlord/bookings/${booking.id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/landlord/bookings/${booking.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/landlord/tenants/check-in/${booking.id}`}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Process Check-in
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <DollarSign className="h-4 w-4 mr-2" />
                              View Payments
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                  <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
              </motion.div>
            );
          }))}

          {!isLoading && filteredBookings.length === 0 && (
            <Card className="border-none shadow-md">
              <CardContent className="p-12 text-center">
                <CalendarCheck className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No bookings found
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Try adjusting your search or filter criteria
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
