"use client";

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Plus,
  Filter,
  MapPin,
  Users,
  TrendingUp,
  MoreVertical,
  Eye,
  Edit,
  BarChart3,
  Settings,
  Check,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useHostels } from '@/features/hostels';

export default function HostelsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('occupancy');

  const { data: hostelsData, isLoading } = useHostels();
  const hostels = hostelsData?.results || [];

  const filteredHostels = hostels.filter((hostel) => {
    const name = hostel.name || '';
    const address = hostel.address || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || hostel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedHostels = [...filteredHostels].sort((a, b) => {
    const occA = a.total_rooms > 0 ? ((a.total_rooms - a.available_rooms) / a.total_rooms) * 100 : 0;
    const occB = b.total_rooms > 0 ? ((b.total_rooms - b.available_rooms) / b.total_rooms) * 100 : 0;
    
    if (sortBy === 'occupancy') return occB - occA;
    if (sortBy === 'revenue') return (parseFloat(b.base_price || '0') * (b.total_rooms - b.available_rooms)) - (parseFloat(a.base_price || '0') * (a.total_rooms - a.available_rooms));
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    return 0;
  });

  const totalRooms = hostels.reduce((sum, h) => sum + h.total_rooms, 0);
  const totalOccupied = hostels.reduce((sum, h) => sum + (h.total_rooms - h.available_rooms), 0);
  const avgOccupancy = totalRooms > 0 ? ((totalOccupied / totalRooms) * 100).toFixed(1) : '0';
  const totalRevenue = hostels.reduce((sum, h) => sum + (parseFloat(h.base_price || '0') * (h.total_rooms - h.available_rooms)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Hostel Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage all your properties in one place
          </p>
        </div>
        <Link href="/landlord/hostels/new">
          <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700">
            <Plus className="h-4 w-4" />
            Add New Hostel
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Hostels</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{hostels.length}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
                <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Rooms</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalRooms}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Occupancy</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{avgOccupancy}%</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-950/30">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</p>
                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    KES {(totalRevenue / 1000000).toFixed(2)}M
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-950/30">
                <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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
                placeholder="Search hostels by name or location..."
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
                <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occupancy">Occupancy Rate</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Hostels Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-none shadow-md overflow-hidden h-[400px]">
              <Skeleton className="h-48 w-full" />
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </Card>
          ))
        ) : (
          sortedHostels.map((hostel, index) => {
            const occupiedRooms = hostel.total_rooms - hostel.available_rooms;
            const occupancyRate = hostel.total_rooms > 0 
              ? Math.round((occupiedRooms / hostel.total_rooms) * 100)
              : 0;
            const monthlyRevenue = parseFloat(hostel.base_price) * occupiedRooms; // Estimated revenue

            return (
          <motion.div
            key={hostel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                {hostel.images && hostel.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={hostel.images[0]} 
                      alt={hostel.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                <div className="h-full w-full bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-950 dark:to-cyan-950 flex items-center justify-center">
                  <Building2 className="h-20 w-20 text-emerald-600/20 dark:text-emerald-400/20" />
                </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  {hostel.is_verified && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0">
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge
                    className={cn(
                      'border-0',
                      hostel.status === 'active'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                    )}
                  >
                    {hostel.status === 'active' ? 'Active' : 'Maintenance'}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                      {hostel.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs truncate">{hostel.address}</span>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/landlord/hostels/${hostel.slug || hostel.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/landlord/hostels/${hostel.slug || hostel.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Hostel
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/landlord/hostels/${hostel.slug || hostel.id}/analytics`}>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/landlord/hostels/${hostel.slug || hostel.id}/rooms`}>
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Rooms
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {hostel.total_rooms}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Total Rooms</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {occupiedRooms}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Occupied</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {hostel.available_rooms}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Available</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Occupancy Rate
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {occupancyRate}%
                    </span>
                  </div>
                  <Progress value={occupancyRate} className="h-2" />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Est. Monthly Revenue</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      KES {(monthlyRevenue / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Landlord</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {hostel.landlord_name || 'Owner'}
                    </p>
                  </div>
                </div>
              </CardContent>

              <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Card>
          </motion.div>
          );
         })
         )}
      </div>

      {!isLoading && sortedHostels.length === 0 && (
        <Card className="border-none shadow-md">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No hostels found
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
