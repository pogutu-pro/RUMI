'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookings } from '@/features/bookings';
import { Calendar, MapPin, Users, DollarSign, ArrowLeft } from 'lucide-react';

export default function ActiveBookingsPage() {
  const { data: bookings, isLoading } = useBookings();

  const activeBookings = React.useMemo(() => {
    return bookings?.filter((b) => b.status === 'confirmed') || [];
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
            Active Bookings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeBookings.length} active {activeBookings.length === 1 ? 'booking' : 'bookings'}
          </p>
        </div>
      </div>

      {/* Active Bookings List */}
      {activeBookings.length > 0 ? (
        <div className="grid gap-4">
          {activeBookings.map((booking) => (
            <Card key={booking.id} className="bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-foreground">
                      {booking.hostel.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Booking #{booking.id.slice(0, 8)}
                    </p>
                  </div>
                  <Badge className="bg-emerald-600 text-white">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Booking Details */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Room</p>
                      <p className="text-sm font-medium text-foreground">
                        {booking.room.name} • {booking.room.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium text-foreground">
                        {booking.durationMonths} months
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Check-in Date</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(booking.moveInDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-sm font-medium text-foreground">
                        KES {booking.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/student/bookings/${booking.id}`} className="flex-1">
                    <Button variant="outline" className="w-full dark:border-gray-700">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="dark:border-gray-700"
                    onClick={() => {
                      // TODO: Extend booking logic
                    }}
                  >
                    Extend Stay
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
              No active bookings
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You don't have any active bookings at the moment.
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
