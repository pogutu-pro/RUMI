"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useHostel } from "@/features/hostels";
import HostelDetails from "@/features/hostels";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  const params = useParams<{ id: string }>();
  const hostelId = params?.id ?? "";

  const { data: hostel, isLoading, error, refetch } = useHostel(hostelId);

  const handleRefresh = () => {
    void refetch();
  };

  if (!hostelId) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">
          Hostel not found
        </h1>
        <p className="text-sm text-slate-500">
          The requested hostel identifier is missing. Please go back to the
          hostels list and try again.
        </p>
        <Button asChild size="sm">
          <Link href="/landlord/hostels">Back to hostels</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">
          Unable to load hostel
        </h1>
        <p className="text-sm text-slate-500">
          We could not retrieve details for this hostel. It may have been
          removed or you may not have permission to view it.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
          <Button asChild size="sm">
            <Link href="/landlord/hostels">Back to hostels</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            {hostel.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage this hostel's listing, rooms, and performance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/landlord/hostels">Back to hostels</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/landlord/hostels/${hostelId}/rooms`}>View rooms</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/landlord/hostels/${hostelId}/edit`}>Edit hostel</Link>
          </Button>
        </div>
      </div>

      <div className="bg-white/90 rounded-xl border shadow-sm p-4 sm:p-6 lg:p-8">
        <HostelDetails hostel={hostel} />
      </div>
    </div>
  );
}
