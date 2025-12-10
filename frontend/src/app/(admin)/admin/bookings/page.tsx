"use client";

import { useState } from "react";
import { Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingTable } from "@/components/admin/booking-table";
import { useBookings } from "@/hooks/use-bookings";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: bookings, isLoading } = useBookings();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bookings</h1>
          <p className="mt-2 text-slate-500">Manage student bookings and reservations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export List
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Create Booking
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">All Bookings</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search bookings..."
                  className="pl-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BookingTable 
            bookings={bookings || []} 
            isLoading={isLoading} 
            onViewDetails={(booking) => console.log('View details', booking)}
            onCancelBooking={(booking) => console.log('Cancel booking', booking)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
