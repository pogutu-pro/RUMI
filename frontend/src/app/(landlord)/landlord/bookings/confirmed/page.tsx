"use client";

import { BookingsList } from '@/features/landlord';

export default function ConfirmedBookingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Confirmed Bookings
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage active and confirmed student stays.
        </p>
      </div>
      
      <BookingsList status="confirmed" />
    </div>
  );
}
