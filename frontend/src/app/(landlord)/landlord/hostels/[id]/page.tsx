"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Edit,
  BedDouble,
  Package,
  BarChart3,
  Settings,
  MapPin,
  Users,
  DollarSign,
  Check,
  Building2,
} from "lucide-react";

import { useHostel } from "@/features/hostels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function HostelDetailPage() {
  const params = useParams<{ id: string }>();
  const hostelId = params?.id ?? "";

  const { data: hostel, isLoading, error, refetch } = useHostel(hostelId);

  const handleRefresh = () => {
    void refetch();
  };

  if (!hostelId) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-foreground">
          Hostel not found
        </h1>
        <p className="text-base text-muted-foreground">
          The requested hostel identifier is missing.
        </p>
        <Button asChild size="lg">
          <Link href="/landlord/hostels">Back to hostels</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-foreground">
          Unable to load hostel
        </h1>
        <p className="text-base text-muted-foreground">
          We could not retrieve details for this hostel.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={handleRefresh}>
            Retry
          </Button>
          <Button asChild size="lg">
            <Link href="/landlord/hostels">Back to hostels</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const occupiedRooms = hostel.total_rooms - hostel.available_rooms;
  const occupancyRate = hostel.total_rooms > 0 
    ? Math.round((occupiedRooms / hostel.total_rooms) * 100)
    : 0;
  const estimatedRevenue = parseFloat(hostel.base_price || '0') * occupiedRooms;

  // Quick Action Cards
  const quickActions = [
    {
      title: "Manage Rooms",
      description: "Add, edit or remove rooms",
      href: `/landlord/hostels/${hostelId}/rooms`,
      icon: BedDouble,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Inventory",
      description: "Manage room items and templates",
      href: `/landlord/hostels/${hostelId}/inventory`,
      icon: Package,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Analytics",
      description: "View performance and reports",
      href: `/landlord/hostels/${hostelId}/analytics`,
      icon: BarChart3,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Edit Hostel",
      description: "Update hostel details",
      href: `/landlord/hostels/${hostelId}/edit`,
      icon: Settings,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/landlord/hostels">
                <ChevronLeft className="h-4 w-4 mr-1" />
                All Hostels
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {hostel.name}
            </h1>
            {hostel.is_verified && (
              <Badge className="bg-green-600 text-white border-0 font-bold">
                <Check className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          <p className="mt-1 text-base text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {hostel.address}
          </p>
        </div>
        <Button size="lg" asChild className="gap-2 bg-primary hover:bg-primary/90">
          <Link href={`/landlord/hostels/${hostelId}/edit`}>
            <Edit className="h-5 w-5" />
            Edit Hostel
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground">Total Rooms</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {hostel.total_rooms}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <BedDouble className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground">Occupied</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                  {occupiedRooms}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground">Available</p>
                <p className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {hostel.available_rooms}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Building2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground">Est. Revenue</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  KES {(estimatedRevenue / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Progress */}
      <Card className="border shadow-sm bg-card">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-bold text-foreground">Occupancy Rate</span>
            <span className="text-2xl font-bold text-primary">{occupancyRate}%</span>
          </div>
          <Progress value={occupancyRate} className="h-4" />
          <p className="text-sm text-muted-foreground mt-2">
            {occupiedRooms} of {hostel.total_rooms} rooms are occupied
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card className="border shadow-sm bg-card hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="p-4 md:p-6">
                    <div className={cn("p-3 rounded-lg w-fit mb-3", action.bgColor)}>
                      <Icon className={cn("h-6 w-6", action.color)} />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Hostel Details */}
      <Card className="border shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Hostel Details</CardTitle>
          <CardDescription className="text-muted-foreground">
            Basic information about this property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-bold text-muted-foreground">Base Price</p>
              <p className="text-lg font-bold text-foreground">
                KES {parseFloat(hostel.base_price || '0').toLocaleString()} / month
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-muted-foreground">Gender Policy</p>
              <p className="text-lg font-bold text-foreground capitalize">
                {hostel.gender_policy?.replace('_', ' ') || 'Not specified'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-muted-foreground">Status</p>
              <Badge
                className={cn(
                  'font-bold',
                  hostel.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                )}
              >
                {hostel.status === 'active' ? 'Active' : 'Under Maintenance'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-muted-foreground">Total Floors</p>
              <p className="text-lg font-bold text-foreground">
                {(hostel as any).total_floors || 1} floor(s)
              </p>
            </div>
          </div>
          {hostel.description && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-bold text-muted-foreground mb-2">Description</p>
              <p className="text-base text-foreground">{hostel.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
