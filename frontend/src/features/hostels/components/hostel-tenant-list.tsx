"use client";

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Building2,
  AlertTriangle,
  History,
  LogOut,
  Bell,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useLandlordTenants } from '@/features/users';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserEntity } from '@/features/users';
import { toast } from 'sonner';

interface LandlordTenant extends UserEntity {
    hostel_name?: string;
    room_number?: string;
    bed_number?: string;
    payment_status?: 'current' | 'late' | 'overdue';
    last_payment_date?: string;
    lease_start?: string;
    lease_end?: string;
    monthly_rent?: number;
    occupancy_status?: 'occupied' | 'vacating' | 'reserved';
    emergency_contact?: string;
    university?: string;
}

interface HostelTenantListProps {
  hostelId: string;
}

export function HostelTenantList({ hostelId }: HostelTenantListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [occupancyFilter, setOccupancyFilter] = useState('all');

  const { data: usersData, isLoading } = useLandlordTenants({ hostelId });

  // Safely extract results whether paginated or flat array
  const rawTenants = React.useMemo(() => {
    if (!usersData) return [];
    if (Array.isArray(usersData)) return usersData;
    // @ts-ignore - Handle paginated response generically
    return usersData.results || usersData.data || [];
  }, [usersData]);

  const tenants: LandlordTenant[] = rawTenants as LandlordTenant[];

  const filteredTenants = tenants.filter((tenant) => {
    const name = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unknown';
    const email = tenant.email || '';
    const phone = tenant.phone_number || '';
    
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery);
      
    const paymentStatus = tenant.payment_status || 'current';
    const matchesPayment = paymentFilter === 'all' || paymentStatus === paymentFilter;
    
    const occupancyStatus = tenant.occupancy_status || 'occupied';
    const matchesOccupancy = occupancyFilter === 'all' || occupancyStatus === occupancyFilter;

    return matchesSearch && matchesPayment && matchesOccupancy;
  });

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) || 'TN';
  };

  const handleSendReminder = (tenantId: string) => {
      toast.success("Reminder Sent", {
          description: "Rent reminder has been sent via SMS and Email.",
      });
  };

  const handleMarkVacated = (tenantId: string) => {
      toast.success("Status Updated", {
          description: "Tenant marked as vacating. Checkout process initiated.",
      });
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 py-4 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2">
                 <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[160px] h-11">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                 <Select value={occupancyFilter} onValueChange={setOccupancyFilter}>
                  <SelectTrigger className="w-[160px] h-11">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="vacating">Vacating</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
            </div>
      </div>

      {/* Tenants List */}
      <div className="grid gap-4">
        {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-2">
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            ))
        ) : filteredTenants.length === 0 ? (
             <Card className="border-dashed shadow-none py-12">
                <CardContent className="flex flex-col items-center justify-center text-center p-0">
                    <div className="p-4 rounded-full bg-muted mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">No tenants found</h3>
                    <p className="text-muted-foreground mb-4">No occupants are currently residing in this property.</p>
                </CardContent>
            </Card>
        ) : (
            <AnimatePresence mode='popLayout'>
                {filteredTenants.map((tenant, index) => {
                    const name = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Tenant';
                    const paymentStatus = tenant.payment_status || 'current';
                    const isLate = paymentStatus === 'late' || paymentStatus === 'overdue';
                    const occupancyStatus = tenant.occupancy_status || 'occupied';
                    
                    return (
                        <motion.div
                            key={tenant.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                            <Card className="group overflow-hidden border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 bg-card">
                                <CardContent className="p-0">
                                    <div className="flex flex-col lg:flex-row">
                                        {/* Left: Main Info */}
                                        <div className="flex-1 p-6 flex items-start gap-4">
                                            <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                                                <AvatarImage src={tenant.profile_picture || undefined} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                                                    {getInitials(name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Link href={`/landlord/tenants/${tenant.id}`} className="hover:underline">
                                                        <h3 className="text-lg font-bold text-foreground truncate">{name}</h3>
                                                    </Link>
                                                     {occupancyStatus === 'vacating' && (
                                                        <Badge variant="secondary" className="bg-warning/10 text-warning hover:bg-warning/10 border-0">
                                                            Vacating Soon
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                                     <div className="flex items-center gap-1.5">
                                                        <Building2 className="h-4 w-4 opacity-70" />
                                                        <span className="font-medium text-foreground/80">Room {tenant.room_number || 'N/A'}</span>
                                                    </div>
                                                     <div className="flex items-center gap-1.5">
                                                        <Phone className="h-4 w-4 opacity-70" />
                                                        <span>{tenant.phone_number || 'No Phone'}</span>
                                                    </div>
                                                     <div className="flex items-center gap-1.5 hidden sm:flex">
                                                        <Mail className="h-4 w-4 opacity-70" />
                                                        <span className="truncate max-w-[200px]">{tenant.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle: Financials & Status (Desktop Table-like view) */}
                                        <div className="border-t lg:border-t-0 lg:border-l border-border bg-muted/5 p-6 min-w-[250px] flex flex-col justify-center gap-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-muted-foreground">Status</span>
                                                 <span className={cn(
                                                    "text-sm font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1.5",
                                                    paymentStatus === 'current' ? "text-success bg-success/10" :
                                                    paymentStatus === 'late' ? "text-warning bg-warning/10" :
                                                    "text-destructive bg-destructive/10"
                                                )}>
                                                    {isLate && <AlertTriangle className="h-3 w-3" />}
                                                    {paymentStatus}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-muted-foreground">Monthly Rent</span>
                                                <span className="text-base font-bold text-foreground">
                                                    KES {((tenant.monthly_rent || 0) / 1000).toFixed(1)}K
                                                </span>
                                            </div>
                                             <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-muted-foreground">Last Paid</span>
                                                <span className="text-sm font-medium text-foreground">
                                                    {tenant.last_payment_date ? format(new Date(tenant.last_payment_date), 'MMM dd') : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="border-t lg:border-t-0 lg:border-l border-border p-4 lg:p-6 flex lg:flex-col items-center justify-center gap-2">
                                            <div className="flex w-full gap-2">
                                                <Link href={`/landlord/tenants/${tenant.id}`} className="flex-1">
                                                    <Button variant="outline" className="w-full gap-2 h-10 border-input hover:bg-accent hover:text-accent-foreground">
                                                        <User className="h-4 w-4" />
                                                        <span className="hidden lg:inline">Profile</span>
                                                    </Button>
                                                </Link>
                                                
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10">
                                                      <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleSendReminder(tenant.id)}>
                                                      <Bell className="h-4 w-4 mr-2" />
                                                      Send Rent Reminder
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                       <Link href={`/landlord/bookings/new?student_id=${tenant.id}`}>
                                                            <History className="h-4 w-4 mr-2" />
                                                            View Payment History
                                                       </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                     <DropdownMenuItem className="text-warning focus:text-warning" onClick={() => handleMarkVacated(tenant.id)}>
                                                      <LogOut className="h-4 w-4 mr-2" />
                                                      Mark as Vacating
                                                    </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            
                                            {isLate && (
                                                <Button 
                                                    size="sm" 
                                                    className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 border-0 shadow-none mt-0 lg:mt-2"
                                                    onClick={() => handleSendReminder(tenant.id)}
                                                >
                                                    <Bell className="h-3 w-3 mr-2" />
                                                    Nudge to Pay
                                                </Button>
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
