'use client';

import * as React from 'react';
import Link from 'next/link';
import { useBookings } from '@/features/bookingss';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  Plus, 
  MapPin, 
  Calendar, 
  Home,
  ArrowRight,
  MoreVertical,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function BookingsPage() {
  const { data: bookings, isLoading } = useBookings();

  const activeBookings = React.useMemo(() => {
    return bookings?.filter((b) => b.status === 'confirmed') || [];
  }, [bookings]);

  const pendingBookings = React.useMemo(() => {
    return bookings?.filter((b) => b.status === 'pending') || [];
  }, [bookings]);

  const pastBookings = React.useMemo(() => {
    return bookings?.filter((b) => ['cancelled'].includes(b.status)) || [];
  }, [bookings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your current stay and view booking history.
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
          <Link href="/student/bookings/new">
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Link>
        </Button>
      </div>

      {/* Active Booking Highlight */}
      {activeBookings.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Current Stay
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {activeBookings.map((booking) => (
              <Card key={booking.id} className="border-emerald-200 bg-emerald-50/30 dark:bg-emerald-900/10 dark:border-emerald-900/50 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 mb-2">Active</Badge>
                      <CardTitle className="text-xl">{booking.hostel.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {booking.hostel.address || 'Nairobi, Kenya'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Report Issue</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Request Move-out</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Room</p>
                    <div className="flex items-center gap-2 font-medium">
                      <Home className="h-4 w-4 text-emerald-600" />
                      {booking.room.name}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Duration</p>
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      {booking.durationMonths} Months
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Check-in</p>
                    <div className="flex items-center gap-2 font-medium">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      {new Date(booking.moveInDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Next Payment</p>
                    <div className="flex items-center gap-2 font-medium">
                      <CalendarCheck className="h-4 w-4 text-emerald-600" />
                      In 12 days
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-emerald-100/50 dark:bg-emerald-900/20 p-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="bg-background">Extend Stay</Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Manage Booking</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Tabs for Other Bookings */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingBookings.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                {pendingBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            History
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {pastBookings.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <BookingSkeleton />
          ) : pendingBookings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingBookings.map((booking) => (
                <Card key={booking.id} className="border-amber-200 bg-amber-50/30 dark:bg-amber-900/10 dark:border-amber-900/50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400">
                        Pending Approval
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(booking.moveInDate).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-base mt-2">{booking.hostel.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room Type</span>
                      <span className="font-medium">{booking.room.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span className="font-medium">KES {booking.totalPrice.toLocaleString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full border-amber-200 hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-900/20">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Clock} 
              title="No pending bookings" 
              description="Any new booking requests will appear here." 
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {isLoading ? (
            <BookingSkeleton />
          ) : pastBookings.length > 0 ? (
            <div className="rounded-md border">
              {pastBookings.map((booking, index) => (
                <div 
                  key={booking.id} 
                  className={cn(
                    "flex items-center justify-between p-4 hover:bg-muted/50 transition-colors",
                    index !== pastBookings.length - 1 && "border-b"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    )}>
                      <XCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{booking.hostel.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.moveInDate).toLocaleDateString()} • {booking.durationMonths} months
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="destructive">
                      {booking.status}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={History} 
              title="No booking history" 
              description="Your past stays will be listed here." 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/30">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-sm mt-1">{description}</p>
    </div>
  );
}

function XCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  )
}
