"use client";

import * as React from 'react';
import { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Building2,
  BedDouble,
  Home,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBookings } from '@/features/bookings';

export default function RoommatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hostelFilter, setHostelFilter] = useState('all');
  
  // We use bookings to determine room occupants.
  // We want to group tenants by Room.
  const { data: bookingsData, isLoading } = useBookings({ status: 'confirmed' });
  const bookings = bookingsData || [];

  // Group by Room
  // Key: hostelId-roomId or just similar.
  // Note: Booking has 'room' object presumably.
  
  const roomGroups = React.useMemo(() => {
    const groups: Record<string, any> = {};
    
    bookings.forEach(booking => {
        if (!booking.room) return;
        
        // Key needs to be unique per room (hostel + room)
        const roomId = (booking.room && typeof booking.room === 'object' && 'id' in booking.room) 
          ? (booking.room as any).id 
          : (booking.roomNumber || 'unknown');
          
        const hostelId = (booking.hostel && typeof booking.hostel === 'object' && 'id' in booking.hostel)
          ? (booking.hostel as any).id
          : (typeof booking.hostel === 'string' ? booking.hostel : 'unknown');
        
        const key = `${hostelId}-${roomId}`;
        
        if (!groups[key]) {
            groups[key] = {
                hostel: (booking.hostel as any).name || 'Unknown Hostel',
                roomNumber: (booking.room as any).number || booking.roomNumber || 'N/A',
                roomType: (booking.room as any).type || 'Standard',
                occupants: []
            };
        }
        
        const student = booking.student as any;
        groups[key].occupants.push({
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            email: student.email,
            avatar: student.profile_picture
        });
    });
    
    return Object.values(groups);
  }, [bookings]);

  // Filter groups
  const filteredGroups = roomGroups.filter(group => {
     const matchesHostel = hostelFilter === 'all' || group.hostel === hostelFilter;
     const matchesSearch = 
        group.hostel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.occupants.some((occ: any) => occ.name.toLowerCase().includes(searchQuery.toLowerCase()));
        
     return matchesHostel && matchesSearch;
  });
  
  const uniqueHostels = Array.from(new Set(roomGroups.map(g => g.hostel)));
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            Room Allocations
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View room occupants and roommate groupings
          </p>
        </div>
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search rooms or tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={hostelFilter} onValueChange={setHostelFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by Hostel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hostels</SelectItem>
                {uniqueHostels.map(h => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         {isLoading ? (
             Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
             ))
         ) : filteredGroups.length === 0 ? (
            <div className="col-span-full py-12 text-center">
                 <div className="inline-flex items-center justify-center p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <BedDouble className="h-8 w-8 text-slate-400" />
                 </div>
                 <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No rooms found</h3>
                 <p className="text-muted-foreground">Try adjusting your filters.</p>
            </div>
         ) : (
             filteredGroups.map((group, index) => (
                <motion.div
                    key={`${group.hostel}-${group.roomNumber}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                    <Card className="h-full border-none shadow-md hover:shadow-lg transition-all duration-300">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Building2 className="h-4 w-4 text-slate-400" />
                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{group.hostel}</span>
                                    </div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        Room {group.roomNumber}
                                    </CardTitle>
                                </div>
                                <Badge variant="outline" className="bg-white dark:bg-slate-800">
                                    {group.occupants.length} Occupants
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {group.occupants.map((occupant: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
                                            <AvatarImage src={occupant.avatar} />
                                            <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-bold">
                                                {getInitials(occupant.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{occupant.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{occupant.email}</p>
                                        </div>
                                    </div>
                                ))}
                                {group.occupants.length === 0 && (
                                    <p className="text-sm text-slate-500 italic">No occupants currently assigned.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
             ))
         )}
      </div>
    </div>
  );
}
