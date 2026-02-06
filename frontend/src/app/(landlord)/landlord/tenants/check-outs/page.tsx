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
  ClipboardList,
  FileDiff,
  DollarSign,
  Receipt,
  CheckCircle2,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useBookings } from '@/features/bookings';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function CheckOutsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const { data: bookingsData, isLoading } = useBookings({ status: 'confirmed' });
  const bookings = bookingsData || [];
  const { toast } = useToast();

  // Mock checking logic for checkouts
  const checkOuts = bookings.map(b => {
      const startDate = new Date(b.move_in_date);
      const durationMonths = Number((b as any).duration || (b as any).durationMonths || 1);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);
      return { ...b, endDate };
  });

  const filteredCheckOuts = checkOuts.filter((booking) => {
    const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student';
    const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filter logic
    if (filter === 'today') return isToday(booking.endDate);
    if (filter === 'upcoming') return isFuture(booking.endDate) && differenceInDays(booking.endDate, new Date()) <= 30;
    if (filter === 'overdue') return isPast(booking.endDate);
    
    return true; 
  }).sort((a, b) => a.endDate.getTime() - b.endDate.getTime());

  const getStatusBadge = (date: Date) => {
    if (isToday(date)) return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0">Ending Today</Badge>;
    if (isPast(date)) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Overdue</Badge>;
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">{differenceInDays(date, new Date())} Days Left</Badge>;
  };

  const handleProcessDeposit = () => {
      toast({
          title: "Deposit Processed",
          description: "Deductions applied and refund initiated.",
      });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <LogOut className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            Check-Outs
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Manage lease endings, inventory comparison, and deposit refunds.
          </p>
        </div>
        <div className="flex gap-2">
             <Button variant="outline" className="gap-2 h-11">
                <History className="h-4 w-4" />
                History Log
            </Button>
        </div>
      </div>

      {/* Filters */}
       <div className="flex flex-col sm:flex-row gap-4 py-4 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
             <div className="flex gap-2">
                 <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[200px] h-11">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Check-Outs</SelectItem>
                    <SelectItem value="today">Ending Today</SelectItem>
                    <SelectItem value="upcoming">Upcoming (30 days)</SelectItem>
                    <SelectItem value="overdue">Expired / Overdue</SelectItem>
                  </SelectContent>
                </Select>
            </div>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-2">
                   <Skeleton className="h-24 w-full rounded-xl" />
                </div>
             ))
        ) : filteredCheckOuts.length === 0 ? (
            <Card className="border-dashed shadow-none py-12">
                 <CardContent className="flex flex-col items-center justify-center text-center p-0">
                    <div className="p-4 rounded-full bg-muted mb-4">
                        <LogOut className="h-8 w-8 text-orange-400" />
                    </div>
                    <h3 className="font-semibold text-lg">No check-outs found</h3>
                    <p className="text-muted-foreground">No leases match your criteria.</p>
                </CardContent>
            </Card>
        ) : (
            <AnimatePresence mode='popLayout'>
            {filteredCheckOuts.map((booking, index) => {
                // Mock checkout steps
                const checkoutStage = index % 3 === 0 ? 'not_started' : index % 3 === 1 ? 'assessment' : 'refund_pending';
                
                const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student';
                const hostelName = typeof booking.hostel === 'object' ? booking.hostel.name : 'Hostel';
                const roomNumber = typeof booking.room === 'object' ? booking.room.room_number : (booking.room_info?.room_number || 'N/A');

                return (
                <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                    <Card className="group overflow-hidden border shadow-sm hover:shadow-md hover:border-orange-500/20 transition-all duration-300 bg-card">
                        <CardContent className="p-0">
                             <div className="flex flex-col sm:flex-row">
                                 {/* Left: Date */}
                                 <div className="p-6 flex items-center sm:flex-col sm:justify-center gap-4 min-w-[120px] bg-muted/10 border-b sm:border-b-0 sm:border-r border-border">
                                      <div className="text-center">
                                        <span className="text-2xl font-bold text-foreground block leading-tight">{format(booking.endDate, 'dd')}</span>
                                        <span className="text-xs font-semibold text-muted-foreground uppercase">{format(booking.endDate, 'MMM')}</span>
                                     </div>
                                     {getStatusBadge(booking.endDate)}
                                 </div>
                                 
                                 {/* Middle: Info */}
                                  <div className="flex-1 p-6 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-foreground">{studentName}</h3>
                                        <Badge variant="outline" className={cn("capitalize border-0",
                                            checkoutStage === 'not_started' ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" :
                                            checkoutStage === 'assessment' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300" :
                                            "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                        )}>
                                            {checkoutStage === 'not_started' ? 'Pending Departure' : 
                                             checkoutStage === 'assessment' ? 'Damage Assessment' : 'Refund Pending'}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="h-4 w-4 opacity-70" />
                                            <span>{hostelName}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-4 w-4 opacity-70" />
                                            <span>Room {roomNumber}</span>
                                        </div>
                                    </div>
                                    
                                    {checkoutStage === 'refund_pending' && (
                                        <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3 text-sm mt-2 border border-border">
                                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                                            <span>
                                                Damage assessed: <strong>KES 1,500</strong> (Paint scratch). Net Refund: <strong>KES 8,500</strong>
                                            </span>
                                        </div>
                                    )}
                                  </div>
                                  
                                  {/* Right actions */}
                                   <div className="p-6 flex items-center justify-center border-t sm:border-t-0 sm:border-l border-border bg-card">
                                        {checkoutStage === 'not_started' ? (
                                            <Link href={`/landlord/tenants/check-out/${booking.id}`} className="w-full sm:w-auto">
                                                <Button variant="outline" className="w-full gap-2 border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-900 dark:hover:bg-orange-900/20">
                                                    Start Checkout <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        ) : checkoutStage === 'assessment' ? (
                                             <Link href={`/landlord/tenants/check-out/${booking.id}/assessment`} className="w-full sm:w-auto">
                                                <Button className="w-full gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0">
                                                    <FileDiff className="h-4 w-4" /> Verify Inventory
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                                        <DollarSign className="h-4 w-4" /> Refund & Close
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Process Refund</DialogTitle>
                                                        <DialogDescription>
                                                            Finalize checkout for {studentName}. 
                                                            This will release the room and refund the deposit.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4 space-y-4">
                                                        <div className="flex justify-between items-center bg-muted p-3 rounded">
                                                            <span>Deposit Paid</span>
                                                            <span className="font-bold">KES 10,000</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded border border-red-100 dark:border-red-900/20">
                                                            <span>Deductions (Damages)</span>
                                                            <span className="font-bold">- KES 1,500</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                                                            <span>Refund Amount</span>
                                                            <span className="text-emerald-600">KES 8,500</span>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline">Cancel</Button>
                                                        <Button onClick={handleProcessDeposit}>Confirm Refund</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                   </div>
                             </div>
                        </CardContent>
                    </Card>
                </motion.div>
                );
            })}
            </AnimatePresence>
        )}
      </div>
    </div>
  );
}
