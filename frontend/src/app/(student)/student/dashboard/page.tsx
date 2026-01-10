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
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header - Mobile-First */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Welcome, {displayName.split(' ')[0]}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Here&apos;s what&apos;s happening with your accommodation today.
        </p>
      </div>

      {/* KPI Cards - Mobile-First: 2 columns on mobile, 4 on desktop */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {rentLoading ? (
          <Skeleton className="h-32 rounded-xl col-span-2" />
        ) : rentStatus ? (
          <div className="col-span-2">
            <RentStatusIndicator rentStatus={rentStatus} className="h-full" />
          </div>
        ) : null}

        <DashboardStat
          title="Messages"
          value={messagesLoading ? '...' : unreadMessages}
          icon={<MessageSquare className="h-4 w-4 md:h-5 md:w-5" />}
          trend={{
            value: 0,
            label: "new",
            direction: "neutral"
          }}
        />

        <DashboardStat
          title="Tickets"
          value={ticketsLoading ? '...' : activeTickets.length}
          icon={<LifeBuoy className="h-4 w-4 md:h-5 md:w-5" />}
          trend={{
            value: 0,
            label: "active",
            direction: "neutral"
          }}
        />
      </section>

      {/* Quick Actions - Mobile-First */}
      <section>
        <h2 className="text-lg md:text-xl font-semibold mb-4">Quick Actions</h2>
        <QuickActions />
      </section>

      {/* Main Content Grid - Mobile-First */}
      <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
        {/* Left Column - Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Financial Overview */}
          <Card className="border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base md:text-lg font-bold">Financial Overview</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/student/payments" className="text-xs md:text-sm">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center gap-3 p-3 md:p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary shrink-0">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm md:text-base font-semibold truncate">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm md:text-base font-bold">KES {transaction.amount.toLocaleString()}</p>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No recent transactions
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Accommodation */}
          <Card className="border shadow-sm bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg font-bold">Current Accommodation</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingLoading ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : currentBooking ? (
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  <div className="h-40 md:h-48 w-full md:w-1/3 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <Home className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="min-w-0">
                      <h3 className="text-lg md:text-xl font-bold truncate">{currentBooking.hostel.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">Room {currentBooking.room.number}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Check-in Date</p>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate">
                            {currentBooking.check_in_date ? new Date(currentBooking.check_in_date).toLocaleDateString() : 'Pending'}
                          </span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm font-semibold">{currentBooking.duration_months} Months</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="w-full md:w-auto">
                      <Link href="/student/bookings">Manage Booking</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Home className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">No Active Booking</h3>
                    <p className="text-sm text-muted-foreground">You don&apos;t have an active hostel booking yet.</p>
                  </div>
                  <Button asChild size="sm">
                    <Link href="/student/hostels">Find a Hostel</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity & Tickets */}
        <div className="space-y-6">
          <RecentActivity activities={activityEvents} />
          
          {/* Support Ticket Summary */}
          {activeTickets.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm md:text-base font-bold text-amber-900 dark:text-amber-500 flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4" />
                  Active Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-3">
                    {activeTickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors">
                        <span className="text-sm font-semibold truncate flex-1 min-w-0 text-amber-900 dark:text-amber-400">
                          {ticket.subject}
                        </span>
                        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400 shrink-0">
                          {ticket.status}
                        </Badge>
                      </div>
                    ))}
                  <Button variant="link" size="sm" className="w-full text-amber-700 dark:text-amber-500 h-auto p-0 pt-2" asChild>
                    <Link href="/student/support">View all tickets <ArrowRight className="ml-1 h-3 w-3" /></Link>
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
