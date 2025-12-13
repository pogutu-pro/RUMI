'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { 
  useRentStatus, 
  useRecentTransactions, 
  useUnreadMessages, 
  useActiveTickets, 
  useActivityFeed 
} from '@/features/student';
import { useMyBooking } from '@/features/bookings/hooks/use-my-booking';
import { RentStatusIndicator } from '@/features/student';
import { DashboardStat } from '@/features/dashboard';
import { RecentActivity } from '@/features/dashboard';
import { QuickActions } from '@/features/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  LifeBuoy, 
  Home, 
  TrendingUp, 
  CreditCard,
  Calendar,
  ArrowRight
} from 'lucide-react';

export default function Page() {
  const { user } = useAuth();
  const { data: currentBooking, isLoading: bookingLoading } = useMyBooking();
  
  // Fetch dashboard data
  const { data: rentStatus, isLoading: rentLoading } = useRentStatus();
  const { data: transactions = [], isLoading: transactionsLoading } = useRecentTransactions(3);
  const { data: unreadMessages = 0, isLoading: messagesLoading } = useUnreadMessages();
  const { data: activeTickets = [], isLoading: ticketsLoading } = useActiveTickets();
  const { data: activityEvents = [], isLoading: activityLoading } = useActivityFeed(5);

  const displayName = React.useMemo(() => {
    if (!user) return 'Student';
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    return user.email.split('@')[0];
  }, [user]);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
      {/* Mobile-Optimized Header */}
      <div className="flex flex-col gap-2 md:gap-4">
        <div>
          {/* Hide full date on mobile, show "Today" instead */}
          <p className="text-xs md:text-sm font-medium text-muted-foreground">
            <span className="md:hidden">Today</span>
            <span className="hidden md:inline">{currentDate}</span>
          </p>
          {/* Smaller heading on mobile */}
          <h1 className="text-xl md:text-3xl font-bold tracking-tight mt-1">
            Welcome, {displayName.split(' ')[0]}
          </h1>
          {/* Hide description on mobile */}
          <p className="text-muted-foreground mt-1 text-sm hidden md:block">
            Here&apos;s what&apos;s happening with your accommodation today.
          </p>
        </div>
      </div>

      {/* Mobile-First Stats Grid - 2 columns on mobile */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {rentLoading ? (
          <Skeleton className="h-24 md:h-[140px] rounded-xl col-span-2" />
        ) : rentStatus ? (
          <div className="col-span-2">
            <RentStatusIndicator rentStatus={rentStatus} className="h-full" />
          </div>
        ) : null}

        <DashboardStat
          title="Messages"
          value={messagesLoading ? '...' : unreadMessages}
          icon={<MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4" />}
          trend={{
            value: 0,
            label: "new",
            direction: "neutral"
          }}
          className="text-xs md:text-sm"
        />

        <DashboardStat
          title="Tickets"
          value={ticketsLoading ? '...' : activeTickets.length}
          icon={<LifeBuoy className="h-3.5 w-3.5 md:h-4 md:w-4" />}
          trend={{
            value: 0,
            label: "active",
            direction: "neutral"
          }}
          className="text-xs md:text-sm"
        />
      </div>

      {/* Quick Actions */}

      {/* Quick Actions - Horizontal Scroll on Mobile */}
      <section>
        <h2 className="text-base md:text-lg font-semibold mb-3 px-1">Quick Actions</h2>
        <div className="md:hidden overflow-x-auto pb-2 -mx-3 px-3">
          <div className="flex gap-3 min-w-max">
            <QuickActions horizontal />
          </div>
        </div>
        <div className="hidden md:block">
          <QuickActions />
        </div>
      </section>

      {/* Main Content - Vertical on Mobile, Grid on Desktop */}
      <div className="space-y-4 md:space-y-8 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
        {/* Main Content */}
        <div className="space-y-4 md:space-y-8 lg:col-span-2">
          {/* Financial Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Financial Overview</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/student/payments" className="text-xs">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactionsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">KES {transaction.amount.toLocaleString()}</p>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent transactions
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Booking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Current Accommodation</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingLoading ? (
                 <Skeleton className="h-48 w-full rounded-lg" />
              ) : currentBooking ? (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="h-48 w-full md:w-1/3 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Home className="h-12 w-12 text-muted-foreground/50" />
                    {/* Placeholder for hostel image */}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{currentBooking.hostel.name}</h3>
                      <p className="text-muted-foreground">Room {currentBooking.room.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Check-in Date</p>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {new Date(currentBooking.moveInDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium">{currentBooking.durationMonths} Months</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" asChild>
                        <Link href="/student/bookings">Manage Booking</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Home className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">No Active Booking</h3>
                    <p className="text-sm text-muted-foreground">You don&apos;t have an active hostel booking yet.</p>
                  </div>
                  <Button asChild>
                    <Link href="/student/hostels">Find a Hostel</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-8">
          <RecentActivity activities={activityEvents} />
          
          {/* Support Ticket Summary */}
          {activeTickets.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-500 flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4" />
                  Active Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[150px]">{ticket.subject}</span>
                      <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400">
                        {ticket.status}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="link" className="w-full text-amber-700 dark:text-amber-500 h-auto p-0 pt-2" asChild>
                    <Link href="/student/support">View all tickets</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
