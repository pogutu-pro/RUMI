"use client";

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Plus,
  MapPin,
  Users,
  TrendingUp,
  MoreVertical,
  Eye,
  Edit,
  BarChart3,
  Settings,
  Check,
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
import { useHostels, useLandlordHostels } from '@/features/hostels';

export default function HostelsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('occupancy');

  const { data: hostelsData, isLoading } = useLandlordHostels();
  const hostels = hostelsData?.results || [];

  // Filter hostels based on search and status
  const filteredHostels = hostels.filter((hostel) => {
    const name = hostel.name || '';
    const address = hostel.address || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || hostel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort hostels
  const sortedHostels = [...filteredHostels].sort((a, b) => {
    const occA = a.total_rooms > 0 ? ((a.total_rooms - a.available_rooms) / a.total_rooms) * 100 : 0;
    const occB = b.total_rooms > 0 ? ((b.total_rooms - b.available_rooms) / b.total_rooms) * 100 : 0;
    
    if (sortBy === 'occupancy') return occB - occA;
    if (sortBy === 'revenue') return (parseFloat(b.base_price || '0') * (b.total_rooms - b.available_rooms)) - (parseFloat(a.base_price || '0') * (a.total_rooms - a.available_rooms));
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    return 0;
  });

  // Calculate stats
  const totalRooms = hostels.reduce((sum, h) => sum + h.total_rooms, 0);
  const totalOccupied = hostels.reduce((sum, h) => sum + (h.total_rooms - h.available_rooms), 0);
  const avgOccupancy = totalRooms > 0 ? ((totalOccupied / totalRooms) * 100).toFixed(0) : '0';
  const totalRevenue = hostels.reduce((sum, h) => sum + (parseFloat(h.base_price || '0') * (h.total_rooms - h.available_rooms)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            My Hostels
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Manage all your properties in one place
          </p>
        </div>
        <Link href="/landlord/hostels/new">
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 font-bold">
            <Plus className="h-5 w-5" />
            Add New Hostel
          </Button>
        </Link>
      </div>

      {/* Stats Overview - Large readable cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground">Total Hostels</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{hostels.length}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground">Total Beds</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{totalRooms}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground">Avg Occupancy</p>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{avgOccupancy}%</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground">Est. Revenue</p>
                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    KES {(totalRevenue / 1000).toFixed(0)}K
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10">
                <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Large touch targets */}
      <Card className="border shadow-sm bg-card">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by hostel name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] h-12 text-base font-medium">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-base">All Status</SelectItem>
                <SelectItem value="active" className="text-base">Active</SelectItem>
                <SelectItem value="under_maintenance" className="text-base">Maintenance</SelectItem>
                <SelectItem value="inactive" className="text-base">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px] h-12 text-base font-medium">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occupancy" className="text-base">Occupancy Rate</SelectItem>
                <SelectItem value="revenue" className="text-base">Revenue</SelectItem>
                <SelectItem value="name" className="text-base">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Hostels Grid - Large cards, easy to read */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border shadow-sm bg-card overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 md:p-6 space-y-4">
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
            const monthlyRevenue = parseFloat(hostel.base_price) * occupiedRooms;

            return (
              <motion.div
                key={hostel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border shadow-sm bg-card hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  {/* Image */}
                  <div className="relative h-40 md:h-48 bg-muted">
                    {hostel.images && hostel.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={hostel.images[0]} 
                        alt={hostel.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Status Badges */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      {hostel.is_verified && (
                        <Badge className="bg-green-600 text-white border-0 font-bold">
                          <Check className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <Badge
                        className={cn(
                          'border-0 font-bold',
                          hostel.status === 'active'
                            ? 'bg-blue-600 text-white'
                            : 'bg-orange-600 text-white'
                        )}
                      >
                        {hostel.status === 'active' ? 'Active' : 'Maintenance'}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg md:text-xl font-bold text-foreground truncate">
                          {hostel.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1 text-base">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{hostel.address}</span>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="font-bold">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/landlord/hostels/${hostel.slug || hostel.id}`} className="text-base">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/landlord/hostels/${hostel.slug || hostel.id}/edit`} className="text-base">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Hostel
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/landlord/hostels/${hostel.slug || hostel.id}/analytics`} className="text-base">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analytics
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/landlord/hostels/${hostel.slug || hostel.id}/rooms`} className="text-base">
                              <Settings className="h-4 w-4 mr-2" />
                              Manage Rooms
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Room Stats - Large numbers */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xl md:text-2xl font-bold text-foreground">
                          {hostel.total_rooms}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground">Total Beds</p>
                      </div>
                      <div>
                        <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                          {occupiedRooms}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                      </div>
                      <div>
                        <p className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {hostel.available_rooms}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground">Available</p>
                      </div>
                    </div>

                    {/* Occupancy Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-muted-foreground">
                          Occupancy Rate
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {occupancyRate}%
                        </span>
                      </div>
                      <Progress value={occupancyRate} className="h-3" />
                    </div>

                    {/* Revenue */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Est. Monthly</p>
                        <p className="text-lg font-bold text-primary">
                          KES {(monthlyRevenue / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/landlord/hostels/${hostel.slug || hostel.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Empty State */}
      {!isLoading && sortedHostels.length === 0 && (
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-12 text-center">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              No hostels found
            </h3>
            <p className="text-base text-muted-foreground mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Add your first hostel to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button size="lg" asChild>
                <Link href="/landlord/hostels/new">
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Hostel
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
