'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookings } from '@/features/bookings';
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, ArrowRightLeft, CalendarCheck, History, Star, UserPlus, ChevronRight } from 'lucide-react';

const quickActions = [
  { title: 'Roommates', href: '/student/roommates', icon: Users, description: 'View your roommates' },
  { title: 'Transfers', href: '/student/transfers', icon: ArrowRightLeft, description: 'Request room change' },
  { title: 'Visitors', href: '/student/security/visitor-invitations', icon: UserPlus, description: 'Invite guests' },
  { title: 'Check In/Out', href: '/student/check-in', icon: CalendarCheck, description: 'Manage your movement' },
  { title: 'Stay History', href: '/student/bookings', icon: History, description: 'View past bookings' },
  { title: 'Reviews', href: '/student/reviews', icon: Star, description: 'Rate your stay' },
];

export default function ActiveBookingsPage() {
  const { data: bookings, isLoading } = useBookings();

  const activeBookings = React.useMemo(() => {
    return bookings?.filter((b) => b.status === 'confirmed') || [];
  }, [bookings]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/student/bookings">
          <Button variant="ghost" size="sm" className="dark:border-gray-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Current Stay
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your active accommodation and stay services
          </p>
        </div>
      </div>

      {/* Active Bookings List */}
      {activeBookings.length > 0 ? (
        <div className="space-y-8">
          <div className="grid gap-4">
            {activeBookings.map((booking) => (
              <Card key={booking.id} className="bg-card border-primary/10 overflow-hidden">
                <CardHeader className="pb-3 bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold text-foreground">
                        {typeof booking.hostel === 'object' ? booking.hostel.name : 'Hostel'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Booking #{booking.id.slice(0, 8)}
                      </p>
                    </div>
                    <Badge className="bg-emerald-600 text-white border-none">Active Now</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {/* Booking Details */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Room</p>
                        <p className="text-sm font-bold text-foreground">
                          {(booking.room as any)?.room_number || booking.room_info?.room_number} • {(booking.room as any)?.room_type || (booking.room as any)?.type || 'Room'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Duration</p>
                        <p className="text-sm font-bold text-foreground">
                          {booking.duration_months} months
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Check-in Date</p>
                        <p className="text-sm font-bold text-foreground">
                          {new Date(booking.move_in_date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Amount</p>
                        <p className="text-sm font-bold text-foreground">
                          KES {booking.total_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Link href={`/student/bookings/${booking.id}`} className="flex-1">
                      <Button variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                        View Full Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="flex-1 dark:border-gray-700 font-semibold"
                      onClick={() => {
                        // TODO: Extend booking logic
                      }}
                    >
                      Extend Stay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions Hub */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <div className="h-6 w-1.5 bg-primary rounded-full" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:bg-accent/50 transition-all duration-200 group cursor-pointer border-border/50 hover:border-primary/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {action.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Card className="bg-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/60 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No active bookings
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You don't have any active bookings at the moment.
            </p>
            <Link href="/student/hostels">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                Browse Hostels
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

