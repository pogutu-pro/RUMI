"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookingTable } from "@/features/admin";
import { useBookings } from "@/hooks/use-bookings";
import { Booking } from "@/types/entities.types";

export default function Page() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: bookings, isLoading } = useBookings();

  const handleViewDetails = (booking: Booking) => {
      router.push(`/admin/bookings/${booking.id}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bookings</h1>
          <p className="mt-1 text-muted-foreground">Manage student bookings, reservations, and history.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export List
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                 <CardTitle className="text-lg font-semibold">All Bookings</CardTitle>
                 <CardDescription>Real-time booking status and details</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  className="pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative min-h-[400px]">
             <BookingTable 
                bookings={bookings || []} 
                isLoading={isLoading} 
                onViewDetails={handleViewDetails}
                onCancelBooking={(booking) => console.log('Cancel booking', booking)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
