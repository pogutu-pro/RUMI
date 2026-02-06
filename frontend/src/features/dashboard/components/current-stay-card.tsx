'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, BedDouble, Search, ChevronRight } from 'lucide-react';
import { Booking } from '@/features/bookings/types/types';

interface CurrentStayCardProps {
  booking: Booking | null;
  loading?: boolean;
}

export function CurrentStayCard({ booking, loading }: CurrentStayCardProps) {
  if (loading) {
     return <Skeleton className="h-full min-h-[340px] w-full rounded-2xl" />;
  }

  if (!booking) {
    return (
      <Card className="h-full border-dashed border-2 bg-muted/20 flex flex-col items-center justify-center p-8 space-y-4 text-center rounded-2xl">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
           <h3 className="font-bold text-base text-foreground">No Active Booking</h3>
           <p className="text-muted-foreground text-xs max-w-[220px] mx-auto">
             Find a convenient residence for your next semester.
           </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link href="/student/hostels">Browse Hostels</Link>
        </Button>
      </Card>
    );
  }

  const { hostel, room, move_in_date, duration_months } = booking;
  const coverImage = (hostel as any).images?.[0] || '/images/hostel-placeholder.jpg';

  return (
    <Card className="group relative h-full min-h-[340px] overflow-hidden rounded-2xl border border-border/50 shadow-sm bg-card">
        {/* Static Header with Image */}
        <div className="relative h-40 w-full">
             <Image 
                src={coverImage} 
                alt={(hostel as any).name || 'Hostel'} 
                fill 
                className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground border-none font-bold text-[10px] uppercase tracking-wider">
               Active Resident
            </Badge>
        </div>

        <CardContent className="p-5 flex flex-col justify-between h-[calc(100%-160px)]">
            <div className="space-y-4">
                <div className="space-y-1">
                     <h2 className="text-xl font-bold text-foreground leading-tight line-clamp-1">{hostel?.name}</h2>
                     <p className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                         <MapPin className="h-3.5 w-3.5 text-primary" />
                         Room {room?.room_number || 'N/A'}
                     </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Check-in
                        </p>
                        <p className="text-sm font-bold text-foreground">
                             {move_in_date ? new Date(move_in_date).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70 flex items-center gap-1">
                            <BedDouble className="h-3 w-3" /> Term
                        </p>
                        <p className="text-sm font-bold text-foreground">
                            {duration_months} Months
                        </p>
                    </div>
                </div>
            </div>

            <Button asChild variant="secondary" className="w-full mt-4 bg-muted text-foreground hover:bg-muted/80 font-bold h-10">
                 <Link href="/student/bookings" className="flex items-center justify-center gap-2">
                    Manage Stay
                    <ChevronRight className="h-4 w-4" />
                 </Link>
            </Button>
        </CardContent>
    </Card>
  );
}
