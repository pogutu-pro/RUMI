'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookings } from '@/features/bookings';
import { Calendar, Download, ArrowLeft } from 'lucide-react';

export default function BookingHistoryPage() {
  const { data: bookings, isLoading } = useBookings();

  const completedBookings = React.useMemo(() => {
    return bookings?.filter((b) => b.status === 'completed' || b.status === 'cancelled') || [];
  }, [bookings]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/student/bookings">
          <Button variant="ghost" size="sm" className="dark:border-gray-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Booking History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {completedBookings.length} past {completedBookings.length === 1 ? 'booking' : 'bookings'}
          </p>
        </div>
      </div>

      {/* History List */}
      {completedBookings.length > 0 ? (
        <div className="space-y-3">
          {completedBookings.map((booking) => (
            <Card key={booking.id} className="bg-card">
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    {booking.hostel.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Room {booking.room.name} • {booking.durationMonths} months
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(booking.moveInDate).toLocaleDateString()} -{' '}
                    {new Date(booking.moveOutDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      booking.status === 'completed'
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-destructive text-destructive-foreground'
                    }
                  >
                    {booking.status === 'completed' ? 'Completed' : 'Cancelled'}
                  </Badge>
                  <Button variant="outline" size="sm" className="dark:border-gray-700">
                    <Download className="h-4 w-4 mr-1" />
                    Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/60 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No booking history
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your past bookings will appear here.
            </p>
            <Link href="/student/hostels">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Browse Hostels
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
