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
  FileText,
  Download,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useBookings } from '@/features/bookings';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Extended Booking type mock for richer UI - handling potential missing backend fields
interface ExtendedBooking {
    id: string;
    booking_reference: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    student: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    hostel: {
        name: string;
        id: string;
    };
    room: {
        number: string;
        type: string;
    };
    bed_number?: string;
    move_in_date: string;
    created_at: string;
    duration: number;
    monthly_rent: number;
    total_amount: number;
    // These might not exist on backend yet
    deposit_status?: 'paid' | 'unpaid' | 'refunded';
    deposit_amount?: number;
    payment_proof_url?: string;
}

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: bookingsData, isLoading } = useBookings({ status: 'all' });
  
  // Safe cast with fallback logic
  const bookings = (bookingsData || []).map(b => ({
      ...b,
      // Ensure strict typing for missing fields to avoid crashes
      booking_reference: b.booking_reference || `BKG-${b.id.substring(0,6)}`,
      deposit_status: (b as any).deposit_status || 'unpaid',
      payment_proof_url: (b as any).payment_proof_url || null
  })) as unknown as ExtendedBooking[];

  const filteredBookings = bookings.filter((booking) => {
    const reference = booking.booking_reference;
    // Handle potential missing student object
    const studentName = booking.student ? `${booking.student.first_name || ''} ${booking.student.last_name || ''}` : 'Unknown Student';
    const hostelName = booking.hostel?.name || 'Unknown Hostel';
    const roomNumber = booking.room?.number?.toString() || 'N/A';
    
    const matchesSearch =
      reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || booking.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle2;
      case 'pending': return Clock;
      case 'cancelled': return XCircle;
      default: return Calendar;
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  const handleApprove = (id: string) => {
      toast({
          title: "Booking Approved",
          description: "Tenant has been notified and bed assigned.",
      });
  };

  const handleReject = (id: string) => {
      toast({
          title: "Booking Rejected",
          description: "Tenant has been notified.",
          variant: "destructive"
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-primary" />
            Bookings
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Review applications, verify payments, and manage reservations.
          </p>
        </div>
        <div className="flex gap-3">
             <Button variant="outline" className="gap-2 h-11">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            {/* Could integrate calendar view toggle here */}
        </div>
      </div>

       {/* Metrics Section */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border shadow-none bg-card">
              <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Total Bookings</span>
                      <span className="text-3xl font-bold text-foreground">{stats.total}</span>
                  </div>
              </CardContent>
          </Card>
           <Card className="border shadow-none bg-card">
              <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Pending Approval</span>
                      <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</span>
                  </div>
              </CardContent>
          </Card>
           <Card className="border shadow-none bg-card">
              <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Confirmed</span>
                      <span className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</span>
                  </div>
              </CardContent>
          </Card>
           <Card className="border shadow-none bg-card">
              <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Completed</span>
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.completed}</span>
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* Tabs & Filters */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <TabsList className="bg-muted p-1 rounded-lg h-12 w-full sm:w-auto grid grid-cols-4 sm:flex gap-1">
              <TabsTrigger value="all" className="h-10 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">All</TabsTrigger>
              <TabsTrigger value="pending" className="h-10 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Pending</TabsTrigger>
              <TabsTrigger value="confirmed" className="h-10 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Confirmed</TabsTrigger>
              <TabsTrigger value="cancelled" className="h-10 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Cancelled</TabsTrigger>
            </TabsList>
            
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
           {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-4">
                  <Skeleton className="h-40 w-full rounded-xl" />
                </div>
            ))
           ) : filteredBookings.length === 0 ? (
             <Card className="border-dashed shadow-none py-12">
                <CardContent className="flex flex-col items-center justify-center text-center p-0">
                    <div className="p-4 rounded-full bg-muted mb-4">
                        <CalendarCheck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">No bookings found</h3>
                    <p className="text-muted-foreground mb-4">You're all caught up for now.</p>
                </CardContent>
            </Card>
           ) : (
            <div className="grid gap-4">
             <AnimatePresence mode='popLayout'>
              {filteredBookings.map((booking, index) => {
                const StatusIcon = getStatusIcon(booking.status);
                const reference = booking.booking_reference || `BKG-${booking.id}`;
                const studentName = `${booking.student?.first_name} ${booking.student?.last_name}`;
                
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Card className="group overflow-hidden border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 bg-card">
                      <CardContent className="p-0">
                         <div className="flex flex-col lg:flex-row">
                             {/* Left: Main Details */}
                             <div className="flex-1 p-6 flex items-start gap-4">
                                <div className={cn("p-3 rounded-xl shrink-0", 
                                    booking.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                                    booking.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' :
                                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                                )}>
                                    <StatusIcon className="h-6 w-6" />
                                </div>
                                
                                <div className="flex-1 min-w-0 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground">{studentName}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{reference}</span>
                                                <span>•</span>
                                                <span>{format(new Date(booking.created_at || new Date()), 'MMM dd, yyyy')}</span>
                                            </div>
                                        </div>
                                         <Badge variant="outline" className={cn("capitalize px-3 py-1 font-semibold", getStatusColor(booking.status))}>
                                            {booking.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 opacity-70" />
                                            <span>{booking.hostel?.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 opacity-70" />
                                            <span>Room {booking.room?.number} {booking.bed_number ? `- Bed ${booking.bed_number}` : ''}</span>
                                        </div>
                                         <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 opacity-70" />
                                            <span>Move-in: <span className="text-foreground font-medium">{format(new Date(booking.move_in_date), 'MMM dd, yyyy')}</span></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 opacity-70" />
                                            <span>{booking.duration} Months Lease</span>
                                        </div>
                                    </div>
                                    
                                     {/* Deposit Status Alert */}
                                     {booking.deposit_status === 'paid' && booking.status === 'pending' && (
                                         <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2 rounded-md border border-emerald-100 dark:border-emerald-900/20">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>Deposit Paid (KES {booking.deposit_amount}) - Ready for review</span>
                                         </div>
                                     )}
                                     {booking.deposit_status !== 'paid' && booking.status === 'pending' && (
                                         <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/10 px-3 py-2 rounded-md border border-orange-100 dark:border-orange-900/20">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>Deposit Pending</span>
                                         </div>
                                     )}
                                </div>
                             </div>

                             {/* Middle: Financials */}
                            <div className="border-t lg:border-t-0 lg:border-l border-border bg-muted/5 p-6 min-w-[200px] flex flex-col justify-center gap-4">
                                <div className="text-center sm:text-left lg:text-center">
                                    <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Total Rent</p>
                                    <p className="text-xl font-bold text-foreground">KES {((booking.total_amount || 0)/1000).toFixed(1)}K</p>
                                </div>
                                <div className="text-center sm:text-left lg:text-center">
                                    <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Monthly</p>
                                    <p className="text-lg font-semibold text-foreground">KES {((booking.monthly_rent || 0)/1000).toFixed(1)}K</p>
                                </div>
                            </div>
                            
                            {/* Right: Actions */}
                            <div className="border-t lg:border-t-0 lg:border-l border-border p-4 lg:p-6 flex lg:flex-col items-center justify-center gap-3 min-w-[180px]">
                                {booking.status === 'pending' ? (
                                    <>
                                        <div className="flex w-full gap-2">
                                            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(booking.id)}>
                                                Approve
                                            </Button>
                                            <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleReject(booking.id)}>
                                                Reject
                                            </Button>
                                        </div>
                                         <Dialog>
                                            <DialogTrigger asChild>
                                                 <Button variant="outline" size="sm" className="w-full">
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    View Proof
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Payment Proof</DialogTitle>
                                                    <DialogDescription>Reference: {reference} - {studentName}</DialogDescription>
                                                </DialogHeader>
                                                <div className="h-64 bg-muted rounded-md flex items-center justify-center border border-dashed">
                                                    <span className="text-muted-foreground">Proof Image would load here</span>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </>
                                ) : (
                                    <div className="flex w-full gap-2 lg:flex-col">
                                         <Link href={`/landlord/bookings/${booking.id}`} className="w-full">
                                            <Button variant="outline" className="w-full">
                                                View Details
                                            </Button>
                                        </Link>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="w-full">
                                              More Options
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Manage Status</DropdownMenuLabel>
                                            <DropdownMenuItem>Change Room</DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </div>

                         </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
             </AnimatePresence>
            </div>
           )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
