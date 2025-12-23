"use client";

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  User,
  AlertTriangle,
  History,
  Info,
  Send,
  LogOut,
  Bell
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
import { useUsers } from '@/features/users';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserEntity } from '@/features/users';
import { useToast } from '@/hooks/use-toast';

  // Mock specific landlord types extensions with optional fields to prevent runtime crash
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

export default function TenantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [occupancyFilter, setOccupancyFilter] = useState('all');
  const [hostelFilter, setHostelFilter] = useState('all');
  
  // Broadcast message state
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const { toast } = useToast();

  const { data: usersData, isLoading } = useUsers({ role: 'student' });
  
  // Safely extract results whether paginated or flat array
  const rawTenants = React.useMemo(() => {
    if (!usersData) return [];
    if (Array.isArray(usersData)) return usersData;
    // @ts-ignore - Handle paginated response generically
    return usersData.results || usersData.data || [];
  }, [usersData]);

  const tenants: LandlordTenant[] = rawTenants as LandlordTenant[];

  const filteredTenants = tenants.filter((tenant) => {
    const name = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || tenant.name || 'Unknown';
    const email = tenant.email || '';
    const phone = tenant.phone_number || '';
    const hostelName = tenant.hostel_name || 'N/A';
    
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      hostelName.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Safe mock defaults
    const paymentStatus = tenant.payment_status || 'current';
    const matchesPayment = paymentFilter === 'all' || paymentStatus === paymentFilter;
    
    const occupancyStatus = tenant.occupancy_status || 'occupied';
    const matchesOccupancy = occupancyFilter === 'all' || occupancyStatus === occupancyFilter;

    const matchesHostel = hostelFilter === 'all' || hostelName === hostelFilter;
    
    return matchesSearch && matchesPayment && matchesOccupancy && matchesHostel;
  });

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) || 'TN';
  };

  const uniqueHostels = Array.from(new Set(tenants.map(t => t.hostel_name || 'N/A').filter(h => h !== 'N/A')));

  // Metrics
  const totalTenants = tenants.length;
  // Assume mock occupancy rate logic or derive from available beds vs tenants if data existed. 
  // For now, based on active tenants in list vs theoretically larger capacity (mock calculation for demo).
  const occupancyRate = totalTenants > 0 ? 85 : 0; 
  const overdueCount = tenants.filter(t => t.payment_status === 'overdue').length;
  const vacatingCount = tenants.filter(t => t.occupancy_status === 'vacating').length;

  const handleBroadcast = () => {
    // API Call would go here
    console.log("Broadcasting:", { subject: messageSubject, body: messageBody, filters: { hostelFilter, paymentFilter } });
    toast({
        title: "Message Sent",
        description: `Broadcast sent to ${filteredTenants.length} tenants.`,
    });
    setIsBroadcastOpen(false);
    setMessageSubject('');
    setMessageBody('');
  };

  const handleSendReminder = (tenantId: string) => {
      toast({
          title: "Reminder Sent",
          description: "Rent reminder has been sent via SMS and Email.",
      });
  }

    const handleMarkVacated = (tenantId: string) => {
      toast({
          title: "Status Updated",
          description: "Tenant marked as vacating. Checkout process initiated.",
      });
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Tenants
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Manage tenancy agreements, payments, and communication.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                <DialogTrigger asChild>
                    <Button size="lg" className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-lg shadow-emerald-900/10 transition-all hover:scale-[1.02]">
                        <Mail className="h-5 w-5" />
                        Broadcast Message
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Broadcast Message</DialogTitle>
                        <DialogDescription>
                            Send a message to all <strong>{filteredTenants.length}</strong> currently filtered tenants.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                            <Input id="subject" placeholder="e.g. Building Maintenance Notice" value={messageSubject} onChange={e => setMessageSubject(e.target.value)} />
                        </div>
                         <div className="grid gap-2">
                            <label htmlFor="message" className="text-sm font-medium">Message</label>
                            <Textarea id="message" placeholder="Type your message here..." rows={5} value={messageBody} onChange={e => setMessageBody(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBroadcastOpen(false)}>Cancel</Button>
                        <Button onClick={handleBroadcast} disabled={!messageSubject || !messageBody}>
                            <Send className="w-4 h-4 mr-2" /> Send Broadcast
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border shadow-none bg-card">
              <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Total Tenants</span>
                      <span className="text-3xl font-bold text-foreground">{totalTenants}</span>
                  </div>
              </CardContent>
          </Card>
           <Card className="border shadow-none bg-card">
              <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Occupancy Rate</span>
                      <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{occupancyRate}%</span>
                  </div>
              </CardContent>
          </Card>
           <Card className="border shadow-none bg-card">
              <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Overdue Rent</span>
                      <span className="text-3xl font-bold text-red-600 dark:text-red-400">{overdueCount}</span>
                  </div>
              </CardContent>
          </Card>
           <Card className="border shadow-none bg-card">
              <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Vacating Soon</span>
                      <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{vacatingCount}</span>
                  </div>
              </CardContent>
          </Card>
      </div>

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
                 <Select value={hostelFilter} onValueChange={setHostelFilter}>
                  <SelectTrigger className="w-[160px] h-11">
                    <SelectValue placeholder="Hostel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hostels</SelectItem>
                    {uniqueHostels.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
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
                    <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms.</p>
                </CardContent>
            </Card>
        ) : (
            <AnimatePresence mode='popLayout'>
                {filteredTenants.map((tenant, index) => {
                    const name = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || tenant.name;
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
                                                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0">
                                                            Vacating Soon
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                                     <div className="flex items-center gap-1.5">
                                                        <Building2 className="h-4 w-4 opacity-70" />
                                                        <span className="font-medium text-foreground/80">{tenant.hostel_name || 'No Hostel'}</span>
                                                        <span>•</span>
                                                        <span>Room {tenant.room_number || 'N/A'}</span>
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
                                                    paymentStatus === 'current' ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                    paymentStatus === 'late' ? "text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400" :
                                                    "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
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
                                                    <DropdownMenuItem>
                                                        <Mail className="h-4 w-4 mr-2" />
                                                        Message Tenant
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                       <Link href={`/landlord/bookings/new?student_id=${tenant.id}`}>
                                                            <History className="h-4 w-4 mr-2" />
                                                            View Payment History
                                                       </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                     <DropdownMenuItem className="text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400" onClick={() => handleMarkVacated(tenant.id)}>
                                                      <LogOut className="h-4 w-4 mr-2" />
                                                      Mark as Vacating
                                                    </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            
                                            {isLate && (
                                                <Button 
                                                    size="sm" 
                                                    className="w-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 border-0 shadow-none mt-0 lg:mt-2"
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
