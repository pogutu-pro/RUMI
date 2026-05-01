"use client";

import { BookingsList } from '@/features/landlord';

export default function PendingBookingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Pending Bookings
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and action incoming booking requests.
        </p>
      </div>
      
      <BookingsList status="pending" />
    </div>
  );
}
