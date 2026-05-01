"use client";

import { useParams } from "next/navigation";
import { useHostel, useRooms } from "@/features/hostels";
import RoomList from "@/features/hostels/components/room-list";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RoomsPage() {
  const params = useParams<{ id: string }>();
  const hostelId = params?.id ?? "";
  
  const { data: hostel, isLoading: isHostelLoading, error: hostelError } = useHostel(hostelId);
  const { data: fetchedRooms, isLoading: isRoomsLoading } = useRooms(hostelId);

  const isLoading = isHostelLoading || isRoomsLoading;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Skeleton className="h-48 w-full rounded-xl" />
           <Skeleton className="h-48 w-full rounded-xl" />
           <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (hostelError || !hostel) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-destructive mb-4">
          <AlertCircle className="h-6 w-6" />
          <h1 className="text-xl font-bold">Failed to load hostel data.</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/landlord/hostels/${hostelId}`}>Back to Hostel</Link>
        </Button>
      </div>
    );
  }

  const rooms = fetchedRooms || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-xl h-12 w-12" asChild>
            <Link href={`/landlord/hostels/${hostelId}`}>
              <ChevronLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Manage Rooms</h1>
            <p className="text-muted-foreground mt-1 font-medium">
              Manage room configurations for <span className="text-foreground font-bold">{hostel.name}</span>
            </p>
          </div>
        </div>
        
        <Button className="h-12 rounded-xl font-bold px-6" asChild>
          <Link href={`/landlord/hostels/${hostelId}/rooms/new`}>
            <Plus className="mr-2 h-5 w-5" />
            Add New Room
          </Link>
        </Button>
      </div>
      
      {rooms.length === 0 ? (
        <div className="bg-muted/30 border-2 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Plus className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black mb-2">No rooms added yet</h2>
          <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8">
            Start by adding rooms to your hostel. You can configure single, shared, or mixed rooms.
          </p>
          <Button className="h-12 rounded-xl font-bold px-8" asChild>
            <Link href={`/landlord/hostels/${hostelId}/rooms/new`}>
              Add Your First Room
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <RoomList rooms={rooms} />
        </div>
      )}
    </div>
  );
}
