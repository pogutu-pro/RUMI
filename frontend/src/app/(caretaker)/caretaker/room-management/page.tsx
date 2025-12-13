'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Home, Users, Wrench, CheckCircle2, AlertTriangle, BedDouble, MapPin, Plus, Filter, Search } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRooms } from '@/features/caretaker';
import { getInitials } from '@/lib/utils/caretaker-helpers';
import { cn } from '@/lib/utils/cn';

export default function Page() {
  const router = useRouter();
  const { data: rooms = [], isLoading } = useRooms();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [floorFilter, setFloorFilter] = React.useState<string>('all');

  // Get unique floors
  const floors = React.useMemo(() => {
    const uniqueFloors = Array.from(new Set(rooms.map(r => r.floor).filter((f): f is number => f !== undefined)));
    return uniqueFloors.sort((a, b) => a - b);
  }, [rooms]);

  // Filter rooms
  const filteredRooms = React.useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = searchQuery === '' || 
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
      const matchesFloor = floorFilter === 'all' || room.floor?.toString() === floorFilter;

      return matchesSearch && matchesStatus && matchesFloor;
    });
  }, [rooms, searchQuery, statusFilter, floorFilter]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = filteredRooms.length;
    const occupied = filteredRooms.filter(r => r.status === 'occupied').length;
    const available = filteredRooms.filter(r => r.status === 'available').length;
    const maintenance = filteredRooms.filter(r => r.status === 'maintenance').length;

    return { total, occupied, available, maintenance };
  }, [filteredRooms]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'occupied':
        return Users;
      case 'available':
        return CheckCircle2;
      case 'maintenance':
        return Wrench;
      default:
        return Home;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Room Management
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            Monitor room occupancy, manage assignments, and track maintenance
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <MapPin className="mr-2 h-4 w-4" />
            Floor Plan
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Occupied</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.occupied}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Available</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.available}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.maintenance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by room number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Floors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {floors.map(floor => (
                  <SelectItem key={floor} value={floor.toString()}>Floor {floor}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || statusFilter !== 'all' || floorFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setFloorFilter('all');
              }}
              className="mt-4"
            >
              Reset Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Room Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredRooms.map((room) => {
          const StatusIcon = getStatusIcon(room.status);
          
          return (
            <Card key={room.id} className="hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      room.status === 'occupied' ? 'bg-blue-100 dark:bg-blue-900/20' :
                      room.status === 'available' ? 'bg-green-100 dark:bg-green-900/20' :
                      'bg-amber-100 dark:bg-amber-900/20'
                    )}>
                      <BedDouble className={cn(
                        "h-5 w-5",
                        room.status === 'occupied' ? 'text-blue-600' :
                        room.status === 'available' ? 'text-green-600' :
                        'text-amber-600'
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
                      <CardDescription className="text-xs">Floor {room.floor || 'N/A'}</CardDescription>
                    </div>
                  </div>
                  <Badge className={cn("capitalize", getStatusColor(room.status))}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {room.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">{room.currentOccupancy} / {room.capacity}</span>
                </div>

                {room.status === 'occupied' && room.tenants && room.tenants.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">Tenants</p>
                    {room.tenants.map((tenant) => (
                      <div key={tenant.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {tenant.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate">{tenant.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {room.status === 'maintenance' && room.maintenanceIssues > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="inline h-3 w-3 mr-1" />
                      {room.maintenanceIssues} {room.maintenanceIssues === 1 ? 'issue' : 'issues'}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
                    View Details
                  </Button>
                  {room.status === 'available' && (
                    <Button size="sm" className="flex-1 text-xs h-8">
                      Assign
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No rooms found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
