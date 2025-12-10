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
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Home,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

import { useUsers } from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';

export default function TenantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [hostelFilter, setHostelFilter] = useState('all');

  // Fetch students (tenants)
  // TODO: Filter by "my tenants" only if backend supports it via this endpoint or a specific landlord-tenants endpoint.
  // Assuming 'student' role + backend filters for landlord's associated students
  const { data: usersData, isLoading } = useUsers({ role: 'student' });
  const tenants = usersData?.results || [];

  const filteredTenants = tenants.filter((tenant) => {
    // Determine fields safely
    const name = `${tenant.first_name} ${tenant.last_name}`;
    const email = tenant.email || '';
    const phone = tenant.phone_number || '';
    // Assuming tenant object has hostel info attached or we default
    // If backend doesn't return hostel/room on generic user list, we might need a dedicated `useLandlordTenants` hook later.
    // For now, mapping safely.
    const hostelName = (tenant as any).hostel_name || 'N/A'; 
    const roomNumber = (tenant as any).room_number || 'N/A';
    
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      hostelName.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Payment status currently not on User object standardly, assuming 'current' or deriving if possible.
    const paymentStatus = (tenant as any).payment_status || 'current';
    const matchesPayment = paymentFilter === 'all' || paymentStatus === paymentFilter;
    
    const matchesHostel = hostelFilter === 'all' || hostelName === hostelFilter;
    
    return matchesSearch && matchesPayment && matchesHostel;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
      case 'late':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400';
      case 'overdue':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-400';
    }
  };

  const getHostelName = (t: any) => t.hostel_name || 'N/A';
  const uniqueHostels = Array.from(new Set(tenants.map(t => getHostelName(t)).filter(h => h !== 'N/A')));
  
  // Stats
  // Using (tenant as any) because strict User type might not have payment_status yet
  const currentTenants = tenants.filter(t => (t as any).payment_status === 'current' || !(t as any).payment_status).length; // Default to current if unknown
  const lateTenants = tenants.filter(t => (t as any).payment_status === 'late' || (t as any).payment_status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Tenant Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Oversee all tenants across your property portfolio
          </p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700">
          <Mail className="h-4 w-4" />
          Broadcast Message
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Tenants</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {tenants.length}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Current Payments</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {currentTenants}
                  </p>
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Late/Overdue</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {lateTenants}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-950/30">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Properties</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {uniqueHostels.length}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, hostel, or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={hostelFilter} onValueChange={setHostelFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Hostel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hostels</SelectItem>
                {uniqueHostels.map((hostel) => (
                  <SelectItem key={hostel} value={hostel}>{hostel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants List */}
      <div className="grid gap-4">
        {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-4">
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            ))
        ) : (
        filteredTenants.map((tenant, index) => {
            // Map tenant fields safely
            const name = `${tenant.first_name} ${tenant.last_name}`;
            const hostelName = (tenant as any).hostel_name || 'Hostel N/A';
            const roomNumber = (tenant as any).room_number || 'N/A';
            const paymentStatus = (tenant as any).payment_status || 'current';
            const monthlyRent = (tenant as any).monthly_rent || 0;
            const lastPaymentDate = (tenant as any).last_payment_date ? new Date((tenant as any).last_payment_date) : undefined;
            const university = (tenant as any).university || 'University';
            const leaseStart = (tenant as any).lease_start ? new Date((tenant as any).lease_start) : undefined;
            const leaseEnd = (tenant as any).lease_end ? new Date((tenant as any).lease_end) : undefined;

            return (
          <motion.div
            key={tenant.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Tenant Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-16 w-16 ring-4 ring-emerald-100 dark:ring-emerald-900/50">
                      <AvatarImage src={tenant.profile_picture || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-950 dark:to-cyan-950 text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {name}
                        </h3>
                        <Badge className={cn('border-0', getPaymentStatusColor(paymentStatus))}>
                          {paymentStatus === 'current' ? 'Current' : paymentStatus === 'late' ? 'Late' : 'Overdue'}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>{hostelName} - Room {roomNumber}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">{tenant.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{tenant.phone_number || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-500">
                        <Calendar className="h-3 w-3" />
                         <span>
                            Lease: {leaseStart ? format(leaseStart, 'MMM dd, yyyy') : 'N/A'} - {leaseEnd ? format(leaseEnd, 'MMM dd, yyyy') : 'N/A'}
                         </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        KES {(monthlyRent / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Monthly Rent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {lastPaymentDate ? format(lastPaymentDate, 'MMM dd') : 'N/A'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Last Payment</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {university}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">University</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link href={`/landlord/tenants/${tenant.id}`}>
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
                          <Link href={`/landlord/tenants/${tenant.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           {/* Assuming finding hostel ID is possible, else skipping link */}
                           { (tenant as any).hostelId ? 
                            <Link href={`/landlord/hostels/${(tenant as any).hostelId}`}>
                                <Home className="h-4 w-4 mr-2" />
                                View Hostel
                            </Link>
                            : <span className="flex items-center pl-2 py-1.5 cursor-default text-sm text-muted-foreground"><Home className="h-4 w-4 mr-2" /> View Hostel</span>
                           }
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-orange-600 dark:text-orange-400">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Payment Reminder
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
      </div>

      {!isLoading && filteredTenants.length === 0 && (
        <Card className="border-none shadow-md">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No tenants found
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
