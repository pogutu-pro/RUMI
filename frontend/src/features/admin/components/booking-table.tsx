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
import { MoreHorizontal, Calendar, CreditCard, User, MoreVertical, Eye, XCircle, CheckCircle } from "lucide-react";
import type { Booking } from "@/types/entities.types";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface BookingTableProps {
  bookings: Booking[];
  isLoading: boolean;
  onViewDetails: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
}

export function BookingTable({ bookings, isLoading, onViewDetails, onCancelBooking }: BookingTableProps) {
  if (isLoading) {
      return (
        <div className="w-full h-48 flex items-center justify-center text-muted-foreground">
          Loading bookings...
        </div>
      );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 capitalize">
                Confirmed
            </Badge>
        );
      case "pending":
        return (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 capitalize">
                Pending
            </Badge>
        );
      case "cancelled":
        return (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 capitalize">
                Cancelled
            </Badge>
        );
      case "completed":
        return (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 capitalize">
                Completed
            </Badge>
        );
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
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
            <TableRow key={booking.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onViewDetails(booking)}>
              <TableCell className="font-mono text-xs text-muted-foreground">{booking.id.substring(0, 8)}...</TableCell>
              <TableCell>
                  <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-secondary rounded-full">
                          <User className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">{booking.studentName}</span>
                  </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{booking.hostelName}</span>
                  <span className="text-xs text-muted-foreground">Room {booking.roomNumber}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {format(new Date(booking.moveInDate), "MMM d, yyyy")}
                  </div>
                  <span className="text-xs text-muted-foreground pl-5">{booking.duration} months</span>
                </div>
              </TableCell>
              <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                      KES {booking.amount.toLocaleString()}
                  </div>
              </TableCell>
              <TableCell>{getStatusBadge(booking.status)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails(booking); }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View details
                    </DropdownMenuItem>
                    {booking.status === 'pending' && (
                        <>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-emerald-600 dark:text-emerald-400">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirm Booking
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onCancelBooking(booking); }}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Booking
                            </DropdownMenuItem>
                        </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {!bookings?.length && (
              <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No bookings found.
                  </TableCell>
              </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
