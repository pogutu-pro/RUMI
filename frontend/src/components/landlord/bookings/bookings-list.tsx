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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useBookings, useUpdateBookingStatus } from '@/hooks/use-bookings';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface BookingsListProps {
  status?: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export default function BookingsList({ status = 'all' }: BookingsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: bookingsData, isLoading } = useBookings({ status: status === 'all' ? undefined : status });
  const updateStatus = useUpdateBookingStatus();
  
  const bookings = bookingsData || [];

  const filteredBookings = bookings.filter((booking) => {
    const reference = booking.reference || `BKG-${booking.id}`;
    const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student';
    const hostelName = typeof booking.hostel === 'object' ? booking.hostel.name : '';
    const roomNumber = typeof booking.room === 'object' ? booking.room.number : (booking.room_number || '');
    
    // Check if status matches if we are in 'all' mode but want to support client-side filter? 
    // Actually the prop 'status' already filtered the API.
    // If status is 'completed', we might also want to show 'cancelled' if this is History page?
    // For now STRICT match to prop if provided, unless prop is 'all'.
    
    const matchesSearch =
      reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
    // If we are in 'history' mode (passed as 'completed' usually), we might want to include cancelled?
    // The hook call `useBookings` with `status: 'completed'` only returns completed.
    // If we want both, we'd need to fetch 'all' and filter here.
    // For simplicity, we assume strict one-to-one mapping for now.
    
    return matchesSearch;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-900';
      case 'pending': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-900';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900';
      case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle2;
      case 'pending': return Clock;
      case 'cancelled': return XCircle;
      case 'completed': return Calendar;
      default: return Calendar;
    }
  };

  const handleStatusUpdate = (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    updateStatus.mutate({ bookingId, status: newStatus }, {
      onSuccess: () => toast.success(`Booking ${newStatus} successfully`),
      onError: () => toast.error(`Failed to update booking`)
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="p-4">
             <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by reference, student, hostel or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-950"
              />
            </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-none shadow-sm">
                <CardContent className="p-6">
                    <div className="flex gap-4">
                         <Skeleton className="h-12 w-12 rounded-full" />
                         <div className="space-y-2 flex-1">
                             <Skeleton className="h-4 w-1/3" />
                             <Skeleton className="h-4 w-1/4" />
                         </div>
                    </div>
                </CardContent>
            </Card>
          ))
        ) : filteredBookings.length === 0 ? (
          <Card className="border-none shadow-sm py-12 bg-muted/10">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <CalendarCheck className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold">No bookings found</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-2">
                {status !== 'all' ? `No ${status} bookings found.` : 'No bookings found matching your search.'}
              </p>
            </div>
          </Card>
        ) : (
            filteredBookings.map((booking, index) => {
                 const StatusIcon = getStatusIcon(booking.status);
                 const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Unknown Student';
                 const hostelName = typeof booking.hostel === 'object' ? booking.hostel.name : 'Unknown Hostel';
                 const roomNumber = typeof booking.room === 'object' ? booking.room.number : (booking.room_number || 'N/A');
                 
                 return (
                    <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 group">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    {/* Student Info */}
                                    <div className="flex items-center gap-4 min-w-[250px]">
                                        <Avatar className="h-12 w-12 border-2 border-slate-100 dark:border-slate-800">
                                            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-bold">
                                                {getInitials(studentName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{studentName}</h3>
                                            <p className="text-sm text-slate-500">Ref: {booking.reference || booking.id.slice(0,8).toUpperCase()}</p>
                                        </div>
                                    </div>

                                    {/* Booking Details */}
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Building2 className="h-4 w-4" />
                                                <span className="truncate">{hostelName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <User className="h-4 w-4" />
                                                <span>Room {roomNumber}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                             <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Calendar className="h-4 w-4" />
                                                <span>In: {format(new Date(booking.check_in_date), 'MMM dd, yyyy')}</span>
                                            </div>
                                             <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <DollarSign className="h-4 w-4" />
                                                <span>KES {booking.total_amount?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-0 w-full md:w-auto">
                                        <Badge variant="outline" className={cn("capitalize gap-1.5 py-1 px-3", getStatusColor(booking.status))}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {booking.status}
                                        </Badge>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                    <Link href={`/landlord/bookings/${booking.id}`} className="flex items-center w-full">
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                {booking.status === 'pending' && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, 'confirmed')} className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Approve
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, 'cancelled')} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                                            <X className="h-4 w-4 mr-2" />
                                                            Reject
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
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
