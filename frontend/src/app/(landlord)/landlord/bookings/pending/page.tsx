"use client";

import BookingsList from '@/components/landlord/bookings/bookings-list';

export default function PendingBookingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Pending Bookings
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Review and action incoming booking requests.
        </p>
      </div>
      
      <BookingsList status="pending" />
    </div>
  );
}
