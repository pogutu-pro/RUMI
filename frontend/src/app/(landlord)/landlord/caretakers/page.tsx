"use client";

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Shield,
  MoreVertical,
  Eye,
  Edit,
  Award,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useCaretakers } from '@/features/landlord';

// Mock types for extended caretaker functionality - aligned with API where possible
interface CaretakerActivity {
    check_ins_completed: number;
    maintenance_tasks: number;
    student_confirmations: number;
    last_active: string;
}

interface ExtendedCaretaker {
    // Extending the base type inferred from usage
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    hostelName: string;
    hostelId: string;
    isActive: boolean;
    createdAt: string;
    rating?: number;
    tasksCompleted?: number;
    occupancyRate?: number;
    // New fields need to be optional or handled if missing
    assigned_rooms?: number;
    permissions?: any; // Allow the API object structure or mock array
    activity?: CaretakerActivity;
}

export default function CaretakersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  // Fetch caretakers from API
  const { data: caretakersData, isLoading } = useCaretakers();
  // Safe cast with fallback for missing properties
  const caretakers = (caretakersData || []).map(c => ({
      ...c,
      // Provide defaults for UI-only fields if API doesn't return them yet
      rating: c.rating || 0,
      tasksCompleted: c.tasksCompleted || 0,
      occupancyRate: c.occupancyRate || 0,
      activity: {
          check_ins_completed: 0,
          maintenance_tasks: 0,
          student_confirmations: 0,
          last_active: new Date().toISOString()
      } as CaretakerActivity
  })) as unknown as ExtendedCaretaker[];

  const filteredCaretakers = caretakers.filter((caretaker) => {
    const fullName = `${caretaker.firstName} ${caretaker.lastName}`;
    const matchesSearch =
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caretaker.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caretaker.hostelName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && caretaker.isActive) ||
      (statusFilter === 'inactive' && !caretaker.isActive);
    return matchesSearch && matchesStatus;
  });

  const sortedCaretakers = [...filteredCaretakers].sort((a, b) => {
    if (sortBy === 'rating') {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    }
    if (sortBy === 'name') {
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'hireDate') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'CT';
  };

  // Metrics
  const totalCaretakers = caretakers.length;
  const activeCaretakers = caretakers.filter(c => c.isActive).length;
  const avgRating = totalCaretakers > 0 
    ? (caretakers.reduce((sum, c) => sum + (c.rating || 0), 0) / totalCaretakers).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Caretakers
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Manage your on-site team, assign hostels, and track performance.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/landlord/caretakers/performance">
            <Button variant="outline" className="gap-2 h-11">
              <Award className="h-4 w-4" />
              Performance Reports
            </Button>
          </Link>
          <Link href="/landlord/caretakers/new">
            <Button className="gap-2 h-11 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-lg shadow-emerald-900/10">
              <Plus className="h-4 w-4" />
              Add Caretaker
            </Button>
          </Link>
        </div>
      </div>

       {/* Metrics Section */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border shadow-none bg-card">
              <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Total Team</span>
                      <span className="text-3xl font-bold text-foreground">{totalCaretakers}</span>
                  </div>
              </CardContent>
          </Card>
           <Card className="border shadow-none bg-card">
              <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Active Now</span>
                      <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{activeCaretakers}</span>
                  </div>
              </CardContent>
          </Card>
           <Card className="border shadow-none bg-card">
              <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Avg Rating</span>
                      <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{avgRating}</span>
                  </div>
              </CardContent>
          </Card>
           <Card className="border shadow-none bg-card">
              <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Hostels Managed</span>
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{caretakers.length}</span>
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 py-4 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or hostel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 text-base"
          />
        </div>
        <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-11">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Rating (High-Low)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="hireDate">Joined (Recent)</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>

      {/* Caretakers List */}
      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="mb-2">
                <Skeleton className="h-32 w-full rounded-xl" />
             </div>
          ))
        ) : sortedCaretakers.length === 0 ? (
           <Card className="border-dashed shadow-none py-12">
              <CardContent className="flex flex-col items-center justify-center text-center p-0">
                  <div className="p-4 rounded-full bg-muted mb-4">
                      <Shield className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">No caretakers found</h3>
                  <p className="text-muted-foreground mb-4">Add a new caretaker or adjust your filters.</p>
                  <Link href="/landlord/caretakers/new">
                        <Button>Add Caretaker</Button>
                  </Link>
              </CardContent>
          </Card>
        ) : (
            <AnimatePresence mode='popLayout'>
              {sortedCaretakers.map((caretaker, index) => (
                <motion.div
                  key={caretaker.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className="group overflow-hidden border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 bg-card">
                    <CardContent className="p-0">
                        <div className="flex flex-col lg:flex-row">
                             {/* Left: Main Info */}
                            <div className="flex-1 p-6 flex items-start gap-4">
                                <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                                    <AvatarImage src={undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                                        {getInitials(caretaker.firstName, caretaker.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-lg font-bold text-foreground">
                                        {caretaker.firstName} {caretaker.lastName}
                                      </h3>
                                       <Badge
                                        variant="outline"
                                        className={cn(
                                          'font-medium border-0 px-2 py-0.5',
                                          caretaker.isActive
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        )}
                                      >
                                        {caretaker.isActive ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                    
                                     <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1.5">
                                            <Building2 className="h-4 w-4 opacity-70" />
                                            <span className="font-medium text-foreground/80">{caretaker.hostelName}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <Phone className="h-4 w-4 opacity-70" />
                                            <span>{caretaker.phone}</span>
                                          </div>
                                           <div className="flex items-center gap-1.5">
                                            <Mail className="h-4 w-4 opacity-70" />
                                            <span>{caretaker.email}</span>
                                          </div>
                                     </div>
                                </div>
                            </div>
                            
                             {/* Middle: Performance & Activity */}
                             <div className="border-t lg:border-t-0 lg:border-l border-border bg-muted/5 p-6 min-w-[300px] flex flex-col justify-center gap-4">
                                  <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                          <Award className="h-4 w-4 text-yellow-500" />
                                          Rating
                                      </span>
                                      <span className="text-base font-bold text-foreground">{caretaker.rating?.toFixed(1) || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                          Check-ins
                                      </span>
                                      <span className="text-base font-bold text-foreground">{caretaker.tasksCompleted || 0}</span>
                                  </div>
                                   <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <span>Last Active</span>
                                        <span>Today, 10:24 AM</span>
                                   </div>
                             </div>

                             {/* Right: Actions */}
                            <div className="border-t lg:border-t-0 lg:border-l border-border p-4 lg:p-6 flex lg:flex-col items-center justify-center gap-2">
                                <div className="flex w-full gap-2">
                                    <Link href={`/landlord/caretakers/${caretaker.id}`} className="flex-1">
                                        <Button variant="outline" className="w-full gap-2 h-10 border-input hover:bg-accent hover:text-accent-foreground">
                                            <Eye className="h-4 w-4" />
                                            <span className="hidden lg:inline">Details</span>
                                        </Button>
                                    </Link>
                                    
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-10 w-10">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                          <DropdownMenuLabel>Manage Caretaker</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem asChild>
                                            <Link href={`/landlord/caretakers/${caretaker.id}/edit`} className="cursor-pointer">
                                              <Edit className="h-4 w-4 mr-2" />
                                              Edit Permissions
                                            </Link>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem asChild>
                                            <Link href={`/landlord/hostels/${caretaker.hostelId}`} className="cursor-pointer">
                                              <Building2 className="h-4 w-4 mr-2" />
                                              Reassign Hostel
                                            </Link>
                                          </DropdownMenuItem>
                                           <DropdownMenuItem asChild>
                                            <Link href={`/landlord/caretakers/${caretaker.id}/inventory`} className="cursor-pointer">
                                              <ClipboardList className="h-4 w-4 mr-2" />
                                              Inventory Logs
                                            </Link>
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem className="text-red-600 dark:text-red-400 cursor-pointer">
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Deactivate Account
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
        )}
      </div>
    </div>
  );
}
