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
  Activity,
  Calendar,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function CaretakersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  // Fetch caretakers from API
  const { data: caretakers = [], isLoading } = useCaretakers();

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
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  // Calculate stats from real data
  const stats = {
    total: caretakers.length,
    active: caretakers.filter(c => c.isActive).length,
    avgRating: caretakers.length > 0 
      ? (caretakers.reduce((sum, c) => sum + (c.rating || 0), 0) / caretakers.length).toFixed(1)
      : '0.0',
    hostelsManaged: caretakers.length, // Each caretaker manages one hostel
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Shield className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Caretaker Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Oversee your property managers and their performance
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/landlord/caretakers/performance">
            <Button variant="outline" className="gap-2">
              <Award className="h-4 w-4" />
              Performance
            </Button>
          </Link>
          <Link href="/landlord/caretakers/new">
            <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700">
              <Plus className="h-4 w-4" />
              Add Caretaker
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Caretakers</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isLoading ? '...' : stats.total}
                </p>
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {isLoading ? '...' : stats.active}
                </p>
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Rating</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isLoading ? '...' : stats.avgRating}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-950/30">
                <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Hostels Managed</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isLoading ? '...' : stats.hostelsManaged}
                </p>
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
                placeholder="Search by name, email, or hostel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Rating (High-Low)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="hireDate">Hire Date (Recent)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Caretakers List */}
      <div className="grid gap-4">
        {isLoading ? (
          // Loading skeletons
          [...Array(3)].map((_, index) => (
            <Card key={index} className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : sortedCaretakers.length === 0 ? (
          <Card className="border-none shadow-md">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No caretakers found
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedCaretakers.map((caretaker, index) => (
            <motion.div
              key={caretaker.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Caretaker Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-16 w-16 ring-4 ring-emerald-100 dark:ring-emerald-900/50">
                        <AvatarImage src={undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-950 dark:to-cyan-950 text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                          {getInitials(caretaker.firstName, caretaker.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {caretaker.firstName} {caretaker.lastName}
                          </h3>
                          <Badge
                            className={cn(
                              'border-0',
                              caretaker.isActive
                                ? 'bg-green-100 text-green-700 dark:bg-green-950dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                            )}
                          >
                            {caretaker.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span>{caretaker.hostelName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>{caretaker.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{caretaker.phone}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-500">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {format(new Date(caretaker.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {caretaker.rating?.toFixed(1) || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Rating</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {caretaker.tasksCompleted || 0}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {caretaker.responseTime ? `${caretaker.responseTime}m` : 'N/A'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Avg Response</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {caretaker.occupancyRate ? `${caretaker.occupancyRate}%` : 'N/A'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Occupancy</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/landlord/caretakers/${caretaker.id}`}>
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
                            <Link href={`/landlord/caretakers/${caretaker.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/landlord/caretakers/${caretaker.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/landlord/hostels/${caretaker.hostelId}`}>
                              <Building2 className="h-4 w-4 mr-2" />
                              View Hostel
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 dark:text-red-400">
                            <XCircle className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
