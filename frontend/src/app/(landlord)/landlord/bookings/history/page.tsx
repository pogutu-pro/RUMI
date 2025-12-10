"use client";

import BookingsList from '@/components/landlord/bookings/bookings-list';

export default function BookingHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Booking History
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          View past, completed, and cancelled bookings.
        </p>
      </div>
      
      <BookingsList status="completed" />
    </div>
  );
}
