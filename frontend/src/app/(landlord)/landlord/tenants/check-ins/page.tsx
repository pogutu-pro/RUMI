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
  ClipboardList,
  FileCheck,
  UploadCloud,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useBookings } from '@/features/bookings';
import Link from 'next/link';
import { useProcessCheckIn } from '@/features/bookings';
import { useToast } from '@/hooks/use-toast';

export default function CheckInsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const { data: bookingsData, isLoading } = useBookings({ status: 'confirmed' });
  const checkIns = bookingsData || [];
  const { toast } = useToast();

  const filteredCheckIns = checkIns.filter((booking) => {
    const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student';
    const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const checkInDate = new Date(booking.move_in_date);
    
    if (filter === 'today') return isToday(checkInDate);
    if (filter === 'upcoming') return isFuture(checkInDate);
    if (filter === 'overdue') return isPast(checkInDate) && !isToday(checkInDate);
    
    return true;
  }).sort((a, b) => new Date(a.move_in_date).getTime() - new Date(b.move_in_date).getTime());

  const handleBulkAction = () => {
      toast({
          title: "Bulk Action Initiated",
          description: "Inventory templates assigned to selected bookings.",
      });
  }

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-primary" />
            Check-Ins
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Manage arrivals, assign inventory templates, and verify condition reports.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="gap-2 h-11" onClick={handleBulkAction}>
                <Layers className="h-4 w-4" />
                Bulk Assign Template
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
                  <SelectTrigger className="w-[180px] h-11">
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
      </div>

      {/* List */}
      <div className="grid gap-4">
        {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-2">
                   <Skeleton className="h-24 w-full rounded-xl" />
                </div>
             ))
        ) : filteredCheckIns.length === 0 ? (
             <Card className="border-dashed shadow-none py-12">
                 <CardContent className="flex flex-col items-center justify-center text-center p-0">
                    <div className="p-4 rounded-full bg-muted mb-4">
                        <CalendarCheck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">No check-ins found</h3>
                    <p className="text-muted-foreground">No pending check-ins match your criteria.</p>
                </CardContent>
            </Card>
        ) : (
            <AnimatePresence mode='popLayout'>
            {filteredCheckIns.map((booking, index) => {
                // Mock extensions for check-in state
                const currentStep = index % 3 === 0 ? 'pending' : index % 3 === 1 ? 'inventory_review' : 'student_signoff';
                
                const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student';
                const hostelName = typeof booking.hostel === 'object' ? booking.hostel.name : 'Hostel';
                const roomNumber = typeof booking.room === 'object' ? booking.room.room_number : (booking.room_info?.room_number || 'N/A');
                const checkInDate = new Date(booking.move_in_date);

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
                            <div className="flex flex-col sm:flex-row">
                                 {/* Left: Date & Status */}
                                 <div className="p-6 flex items-center sm:flex-col sm:justify-center gap-4 min-w-[120px] bg-muted/10 border-b sm:border-b-0 sm:border-r border-border">
                                      <div className="text-center">
                                        <span className="text-2xl font-bold text-foreground block leading-tight">{format(checkInDate, 'dd')}</span>
                                        <span className="text-xs font-semibold text-muted-foreground uppercase">{format(checkInDate, 'MMM')}</span>
                                     </div>
                                     {getStatusBadge(checkInDate)}
                                 </div>

                                 {/* Middle: Info */}
                                 <div className="flex-1 p-6 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-foreground">{studentName}</h3>
                                        <Badge variant="outline" className={cn("capitalize border-0 bg-secondary",
                                            currentStep === 'pending' ? "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300" :
                                            currentStep === 'inventory_review' ? "text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300" :
                                            "text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300"
                                        )}>
                                            {currentStep === 'pending' ? 'Not Started' : currentStep.replace('_', ' ')}
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
                                    
                                     {/* Progress Bar Mock */}
                                     {currentStep !== 'pending' && (
                                         <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
                                             <div className={cn("h-full rounded-full",
                                                 currentStep === 'inventory_review' ? "w-1/2 bg-orange-400" : "w-3/4 bg-blue-400"
                                             )} />
                                         </div>
                                     )}
                                 </div>

                                 {/* Right: Action */}
                                 <div className="p-6 flex items-center justify-center border-t sm:border-t-0 sm:border-l border-border bg-card">
                                    <Link href={`/landlord/tenants/check-in/${booking.id}`} className="w-full sm:w-auto">
                                        <Button className={cn("gap-2 w-full shadow-sm",
                                            currentStep === 'pending' ? "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white" :
                                            "variant-outline border-input hover:bg-accent hover:text-accent-foreground"
                                        )}>
                                            {currentStep === 'pending' ? (
                                                <>Start Check-In <ArrowRight className="h-4 w-4" /></>
                                            ) : (
                                                <>Continue Process</>
                                            )}
                                        </Button>
                                    </Link>
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
