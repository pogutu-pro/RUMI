"use client";

import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  User, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle,
  Download,
  MoreVertical,
  Mail,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useBooking, useUpdateBookingStatus } from "@/features/bookings";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const { data: booking, isLoading } = useBooking(id);
  const updateBookingStatus = useUpdateBookingStatus();

  if (isLoading) {
    return (
      <div className="space-y-6">
         <Skeleton className="h-8 w-48" />
         <div className="grid gap-6 md:grid-cols-3">
             <Skeleton className="h-96 md:col-span-2 rounded-xl" />
             <Skeleton className="h-96 md:col-span-1 rounded-xl" />
         </div>
      </div>
    );
  }

  if (!booking) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <h2 className="text-2xl font-bold text-foreground">Booking Not Found</h2>
              <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/bookings')}>
                  Back to All Bookings
              </Button>
          </div>
      )
  }

  const handleStatusUpdate = (status: 'confirmed' | 'cancelled') => {
      // Logic for status update
      // updateBookingStatus.mutate({ id: booking.id, status });
      // Would need to update hook or type to support this mutation properly
      console.log('Update status', status);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <Button 
            variant="ghost" 
            className="mb-4 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground group"
            onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Bookings
        </Button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
           <div>
              <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">Booking Details</h1>
                  <Badge 
                       variant="outline"
                       className={cn(
                        "capitalize",
                        booking.status === "confirmed" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400" 
                          : booking.status === "cancelled"
                          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"
                      )}
                   >
                       {booking.status}
                   </Badge>
              </div>
              <p className="text-muted-foreground mt-1 font-mono text-sm">ID: {booking.id}</p>
           </div>

           <div className="flex gap-2">
               <Button variant="outline" className="gap-2">
                   <Download className="h-4 w-4" />
                   Invoice
               </Button>
               {booking.status === 'pending' && (
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button>
                           Actions
                           <MoreVertical className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-emerald-600 dark:text-emerald-400" onClick={() => handleStatusUpdate('confirmed')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm Booking
                        </DropdownMenuItem>
                         <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate('cancelled')}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Booking
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
               )}
           </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
         {/* Main Details */}
         <div className="md:col-span-2 space-y-6">
             <Card className="border-border/50 shadow-sm">
                 <CardHeader>
                     <CardTitle className="text-lg">Reservation Info</CardTitle>
                 </CardHeader>
                 <CardContent className="grid gap-6 sm:grid-cols-2">
                     <div className="space-y-1">
                         <p className="text-sm font-medium text-muted-foreground">Property</p>
                         <div className="flex items-center gap-2">
                             <Building2 className="h-4 w-4 text-primary" />
                             <span className="font-medium">{booking.hostelName}</span>
                         </div>
                     </div>
                     <div className="space-y-1">
                         <p className="text-sm font-medium text-muted-foreground">Room</p>
                         <p className="font-medium">Room {booking.roomNumber}</p>
                     </div>
                     <div className="space-y-1">
                         <p className="text-sm font-medium text-muted-foreground">Check-in Date</p>
                         <div className="flex items-center gap-2">
                             <Calendar className="h-4 w-4 text-muted-foreground" />
                             <span className="font-medium">{format(new Date(booking.moveInDate), 'MMMM d, yyyy')}</span>
                         </div>
                     </div>
                     <div className="space-y-1">
                         <p className="text-sm font-medium text-muted-foreground">Duration</p>
                         <div className="flex items-center gap-2">
                             <Clock className="h-4 w-4 text-muted-foreground" />
                             <span className="font-medium">{booking.duration} months</span>
                         </div>
                     </div>
                 </CardContent>
             </Card>

             <Card className="border-border/50 shadow-sm">
                 <CardHeader>
                     <CardTitle className="text-lg">Payment Summary</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <div className="space-y-4">
                         <div className="flex justify-between items-center text-sm">
                             <span className="text-muted-foreground">Rent Amount (Monthly)</span>
                             <span className="font-medium">KES {Math.round(booking.amount / booking.durationMonths).toLocaleString()}</span>
                         </div>
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-muted-foreground">Duration</span>
                             <span className="font-medium">{booking.duration} Months</span>
                         </div>
                         <Separator />
                         <div className="flex justify-between items-center text-base font-bold">
                             <span>Total Amount</span>
                             <span>KES {booking.amount.toLocaleString()}</span>
                         </div>
                         <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CreditCard className="h-4 w-4" />
                                Payment Method
                            </div>
                            <span className="capitalize font-medium">{booking.paymentMethod}</span>
                         </div>
                     </div>
                 </CardContent>
             </Card>
         </div>

         {/* Sidebar - User Info */}
         <div className="md:col-span-1 space-y-6">
             <Card className="border-border/50 shadow-sm">
                 <CardHeader>
                     <CardTitle className="text-lg">Student Details</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-6">
                     <div className="flex items-center gap-4">
                         <Avatar className="h-12 w-12">
                             {/* <AvatarImage src={booking.studentAvatar} /> */}
                             <AvatarFallback className="bg-primary/10 text-primary">
                                 {booking.studentName.substring(0,2).toUpperCase()}
                             </AvatarFallback>
                         </Avatar>
                         <div>
                             <p className="font-medium leading-none">{booking.studentName}</p>
                             <p className="text-sm text-muted-foreground mt-1">Student</p>
                         </div>
                     </div>
                     
                     <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:student@example.com`} className="hover:underline">student@example.com</a>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>+254 7XX XXX XXX</span>
                        </div>
                     </div>

                     <Button variant="outline" className="w-full" onClick={() => router.push(`/admin/users/${booking.studentId}`)}>
                         View Full Profile
                     </Button>
                 </CardContent>
             </Card>
         </div>
      </div>
    </div>
  );
}
