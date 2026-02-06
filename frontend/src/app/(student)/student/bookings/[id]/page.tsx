'use client';

import * as React from 'react';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandedLoader } from '@/components/ui/branded-loader';
import { useBooking } from '@/features/bookings';

export default function Page() {
  const params = useParams<{ id: string }>();
  const { data: booking, isLoading, error } = useBooking(params.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <BrandedLoader size={20} text="" className="p-0" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          We could not find this booking. It may have been cancelled or is no
          longer available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {typeof booking.hostel === 'object' ? booking.hostel.name : 'Hostel'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Room {(booking.room as any)?.room_number || booking.room_info?.room_number} • Move-in{' '}
            {new Date(booking.move_in_date).toLocaleDateString()}
          </p>
        </div>
        <Badge variant="outline" className="text-[11px]">
          {booking.status}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Booking details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
          <p>Duration: {booking.duration_months} months</p>
          <p>Total: KES {booking.total_amount}</p>
          <p>Check-in: {new Date(booking.move_in_date).toLocaleDateString()}</p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-[11px]"
          disabled
        >
          Cancel booking
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-[11px]"
          disabled
        >
          Download receipt
        </Button>
      </div>
    </div>
  );
}
