"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import type { Booking } from "@/types/entities.types";
import { format } from "date-fns";

interface BookingTableProps {
  bookings: Booking[];
  isLoading: boolean;
  onViewDetails: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
}

export function BookingTable({ bookings, isLoading, onViewDetails, onCancelBooking }: BookingTableProps) {
  if (isLoading) {
    return <div>Loading bookings...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead>Booking ID</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Hostel & Room</TableHead>
            <TableHead>Move-in Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id} className="hover:bg-slate-50/50">
              <TableCell className="font-medium text-slate-900">{booking.id}</TableCell>
              <TableCell>{booking.studentName}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900">{booking.hostelName}</span>
                  <span className="text-xs text-slate-500">{booking.roomNumber}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-slate-900">{format(new Date(booking.moveInDate), "MMM d, yyyy")}</span>
                  <span className="text-xs text-slate-500">{booking.duration} months</span>
                </div>
              </TableCell>
              <TableCell className="font-medium text-slate-900">KES {booking.amount.toLocaleString()}</TableCell>
              <TableCell>{getStatusBadge(booking.status)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewDetails(booking)}>View details</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => onCancelBooking(booking)}>
                      Cancel booking
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
