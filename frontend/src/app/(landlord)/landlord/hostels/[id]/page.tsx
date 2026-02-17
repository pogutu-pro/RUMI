"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Edit,
  BedDouble,
  BarChart3,
  MapPin,
  Users,
  DollarSign,
  Check,
  Building2,
  AlertCircle,
  Zap,
  Smartphone,
} from "lucide-react";

import { useHostel } from "@/features/hostels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BedManagementTable } from "@/features/landlord/components/bed-management-table";
import { MpesaSettingsList } from "@/features/payments/components/mpesa-settings-list";
import { MpesaSettingsForm } from "@/features/payments/components/mpesa-settings-form";

export default function HostelDetailPage() {
  const params = useParams<{ id: string }>();
  const hostelId = params?.id ?? "";
  const [mpesaView, setMpesaView] = React.useState<'list' | 'create'>('list');

  const { data: hostel, isLoading, error, refetch } = useHostel(hostelId);

  const handleRefresh = () => {
    void refetch();
  };

  if (!hostelId) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-foreground">Hostel not found</h1>
        <p className="text-base text-muted-foreground">The requested hostel identifier is missing.</p>
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
        <h1 className="text-xl font-bold text-foreground">Unable to load hostel</h1>
        <p className="text-base text-muted-foreground">We could not retrieve details for this hostel.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={handleRefresh}>Retry</Button>
          <Button asChild size="lg">
            <Link href="/landlord/hostels">Back to hostels</Link>
          </Button>
        </div>
      </div>
    );
  }

  const occupiedRooms = hostel.total_rooms - hostel.available_rooms;
  const occupancyRate = hostel.total_rooms > 0 
    ? Math.round((occupiedRooms / hostel.total_rooms) * 100)
    : 0;
  const estimatedRevenue = parseFloat(hostel.base_price || '0') * occupiedRooms;

  return (
    <div className="space-y-6">
      {/* Restriction Banner */}
      {hostel.is_restricted && (
        <Card className="border-warning bg-warning/10 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/20">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Hostel is Restricted (Read-Only)</h3>
                <p className="text-sm text-muted-foreground">
                  Management features are disabled due to an outstanding subscription invoice. 
                  Please settle your payment to restore full access.
                </p>
              </div>
            </div>
            <Button className="bg-warning hover:bg-warning/90 text-black font-bold whitespace-nowrap" asChild>
              <Link href="/landlord/payments/subscription">Pay Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{hostel.name}</h1>
            {hostel.is_verified && (
              <Badge className="bg-green-600 text-white border-0 font-bold">
                <Check className="h-3 w-3 mr-1" /> Verified
              </Badge>
            )}
            {hostel.is_restricted && (
              <Badge variant="outline" className="border-warning text-warning font-bold">Restricted</Badge>
            )}
          </div>
          <p className="mt-1 text-base text-muted-foreground flex items-center gap-2 italic">
            <MapPin className="h-4 w-4" /> {hostel.address}
          </p>
        </div>
        {!hostel.is_restricted && (
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 gap-2">
            <Link href={`/landlord/hostels/${hostelId}/edit`}>
              <Edit className="h-5 w-5" /> Edit Basic Details
            </Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl h-14 w-full justify-start gap-2 border shadow-sm sticky top-0 z-10">
          <TabsTrigger value="overview" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <Building2 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <BedDouble className="h-4 w-4" /> Rooms & Beds
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <DollarSign className="h-4 w-4" /> Finance & Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 font-sans">
            <Card className="border shadow-sm bg-card transition-all hover:shadow-md">
              <CardContent className="p-4 md:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Rooms</p>
                  <p className="text-3xl font-black text-foreground">{hostel.total_rooms}</p>
                </div>
                <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" /></div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card transition-all hover:shadow-md">
              <CardContent className="p-4 md:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest text-emerald-600">Occupied</p>
                  <p className="text-3xl font-black text-emerald-600">{occupiedRooms}</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><Users className="h-6 w-6" /></div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card transition-all hover:shadow-md">
              <CardContent className="p-4 md:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest text-orange-600">Available</p>
                  <p className="text-3xl font-black text-orange-600">{hostel.available_rooms}</p>
                </div>
                <div className="p-3 rounded-2xl bg-orange-50 text-orange-600"><Zap className="h-6 w-6" /></div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card transition-all hover:shadow-md">
              <CardContent className="p-4 md:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest text-blue-600">Est. Revenue</p>
                  <p className="text-3xl font-black text-blue-600">KES {(estimatedRevenue / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><DollarSign className="h-6 w-6" /></div>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm bg-card overflow-hidden">
            <CardContent className="p-6 md:p-10">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-6">
                   <div className="space-y-4">
                      <h3 className="text-2xl font-black">Hostel Description</h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {hostel.description || 'No description provided for this property.'}
                      </p>
                   </div>
                   <div className="grid grid-cols-2 gap-8 pt-6 border-t font-sans">
                      <div>
                        <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1">Gender Policy</p>
                        <p className="text-xl font-bold capitalize">{hostel.gender_policy?.replace('_', ' ') || 'Mixed'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1">Base Price</p>
                        <p className="text-xl font-bold">KES {parseFloat(hostel.base_price || '0').toLocaleString()} / Month</p>
                      </div>
                   </div>
                </div>
                <div className="w-full md:w-80 space-y-4">
                   <h4 className="text-lg font-bold">Occupancy Rate</h4>
                   <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div><Badge variant="secondary" className="font-bold">{occupancyRate}% Full</Badge></div>
                      </div>
                      <Progress value={occupancyRate} className="h-4 rounded-full" />
                      <p className="text-sm text-muted-foreground mt-2 font-medium">
                        {occupiedRooms} of {hostel.total_rooms} rooms currently occupied.
                      </p>
                   </div>
                   <div className="mt-8">
                     <Button variant="outline" className="w-full h-12 rounded-xl font-bold" asChild>
                        <Link href={`/landlord/hostels/${hostelId}/edit`}>Edit Property Details</Link>
                     </Button>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6 outline-none">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm">
             <div className="space-y-1">
               <h3 className="text-2xl font-black">Bed & Account Management</h3>
               <p className="text-muted-foreground font-medium">Assign unique M-Pesa account numbers to each bed for automated tracking.</p>
             </div>
             <div className="flex gap-3">
               <Button variant="outline" asChild className="h-11 px-6 rounded-xl font-bold"><Link href={`/landlord/hostels/${hostelId}/rooms`}>Manage Rooms</Link></Button>
               <Button asChild className="h-11 px-6 rounded-xl font-bold"><Link href={`/landlord/hostels/${hostelId}/inventory`}>Inventory List</Link></Button>
             </div>
          </div>
          <BedManagementTable hostelId={hostelId} />
        </TabsContent>

        <TabsContent value="finance" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
               <Card className="border shadow-none bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/50 overflow-hidden">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-black text-emerald-800 dark:text-emerald-400">Payment Collection</CardTitle>
                    <CardDescription className="text-emerald-700/70 dark:text-emerald-500/70 font-medium">
                      Configure your M-Pesa details so students can pay you directly.
                    </CardDescription>
                 </CardHeader>
                 <CardContent>
                    {mpesaView === 'list' ? (
                      <div className="space-y-6">
                        <MpesaSettingsList onEdit={() => {}} hostelId={hostelId} />
                        <Button 
                          onClick={() => setMpesaView('create')} 
                          className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl shadow-emerald-500/20"
                        >
                          <Smartphone className="mr-2 h-6 w-6" /> Set M-Pesa Details
                        </Button>
                      </div>
                    ) : (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <MpesaSettingsForm 
                          onSuccess={() => { setMpesaView('list'); refetch(); }} 
                          onCancel={() => setMpesaView('list')} 
                        />
                      </div>
                    )}
                 </CardContent>
               </Card>
            </div>

            <div className="space-y-6">
               <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Quick Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="p-10 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center opacity-60">
                        <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-bold">Revenue Tracking</h4>
                        <p className="text-sm text-muted-foreground max-w-xs mt-2">
                          Detailed revenue charts and payment reports for {hostel.name} will appear here as you collect payments.
                        </p>
                     </div>
                     <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 h-12 font-bold rounded-xl" asChild>
                          <Link href={`/landlord/hostels/${hostelId}/analytics`}>Full Analytics</Link>
                        </Button>
                        <Button variant="outline" className="flex-1 h-12 font-bold rounded-xl" asChild>
                          <Link href="/landlord/payments">Payment History</Link>
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
