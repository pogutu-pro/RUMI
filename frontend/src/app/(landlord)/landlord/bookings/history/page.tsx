"use client";

import { BookingsList } from '@/features/landlord';

export default function BookingHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Booking History
        </h1>
        <p className="text-sm text-muted-foreground">
          View past, completed, and cancelled bookings.
        </p>
      </div>
      
      <BookingsList status="completed" />
    </div>
  );
}
