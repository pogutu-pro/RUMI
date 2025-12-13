'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Building, 
  Users, 
  Key, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  BedDouble,
  Shield
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useCaretakerDashboard } from '@/features/caretaker';
import { cn } from '@/lib/utils/cn';

export default function Page() {
  const { data: dashboardData, isLoading } = useCaretakerDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Hostel Overview
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            Manage room occupancy, check-ins, and daily operations
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/caretaker/hostel/check-in/new">
              <Key className="mr-2 h-4 w-4" />
              New Check-In
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/caretaker/hostel/check-out/new">
              <LogOut className="mr-2 h-4 w-4" />
              Process Check-Out
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {dashboardData?.roomOccupancy.occupancyRate}%
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <Progress 
              value={dashboardData?.roomOccupancy.occupancyRate} 
              className="mt-3 h-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {dashboardData?.roomOccupancy.occupied} / {dashboardData?.roomOccupancy.total} beds occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {dashboardData?.roomOccupancy.available}
              </div>
              <BedDouble className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ready for immediate check-in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {dashboardData?.roomOccupancy.underMaintenance}
              </div>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Rooms currently unavailable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Movement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {(dashboardData?.todayOverview.checkInsToday || 0) + (dashboardData?.todayOverview.checkOutsToday || 0)}
              </div>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center text-emerald-600">
                <ArrowRight className="mr-1 h-3 w-3 rotate-45" />
                {dashboardData?.todayOverview.checkInsToday} In
              </span>
              <span className="flex items-center text-red-600">
                <ArrowRight className="mr-1 h-3 w-3 -rotate-45" />
                {dashboardData?.todayOverview.checkOutsToday} Out
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from across the hostel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {dashboardData?.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className={cn(
                    "mt-1 p-2 rounded-full",
                    activity.type === 'check_in' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20" :
                    activity.type === 'check_out' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20" :
                    activity.type === 'maintenance' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" :
                    activity.type === 'security' ? "bg-red-100 text-red-600 dark:bg-red-900/20" :
                    "bg-gray-100 text-gray-600 dark:bg-gray-800"
                  )}>
                    {activity.type === 'check_in' && <Key className="h-4 w-4" />}
                    {activity.type === 'check_out' && <LogOut className="h-4 w-4" />}
                    {activity.type === 'maintenance' && <AlertCircle className="h-4 w-4" />}
                    {activity.type === 'security' && <Shield className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                      {activity.room && (
                        <>
                          <span>•</span>
                          <span>Room {activity.room}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {activity.actionUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={activity.actionUrl}>View</Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Scheduled tasks for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className={cn(
                    "w-1 h-full min-h-[2.5rem] rounded-full",
                    event.priority === 'high' ? "bg-red-500" :
                    event.priority === 'medium' ? "bg-amber-500" :
                    "bg-blue-500"
                  )} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{event.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {new Date(event.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                      {event.room && (
                        <span className="text-xs font-medium text-muted-foreground">
                          Room {event.room}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!dashboardData?.upcomingEvents || dashboardData.upcomingEvents.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">All caught up!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
