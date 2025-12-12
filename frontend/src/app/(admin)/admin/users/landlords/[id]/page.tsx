"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  CreditCard,
  Activity,
  AlertCircle,
  CheckCircle,
  Home,
  FileText,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// This would come from API
const getLandlordDetails = async (id: string) => {
  // Mock data for now
  return {
    id,
    first_name: "Sarah",
    last_name: "Kamau",
    email: "sarah.kamau@example.com",
    phone_number: "+254 722 345 678",
    businessName: "Kamau Properties Ltd",
    businessRegistrationNumber: "PVT-20231234",
    businessAddress: "123 Business Plaza, Nairobi",
    taxCertificate: "https://example.com/tax.pdf",
    status: "verified",
    joinedAt: "2023-06-15",
    lastActive: "2024-12-08T14:30:00",
    profilePicture: null,
    
    hostels: [
      {
        id: "HST-001",
        name: "Sunshine Hostel",
        location: "Nairobi, Kenya",
        rooms: 45,
        occupancy: 38,
        revenue: 570000,
        status: "active",
      },
      {
        id: "HST-002",
        name: "Campus View Hostel",
        location: "Nairobi, Kenya",
        rooms: 30,
        occupancy: 25,
        revenue: 375000,
        status: "active",
      },
    ],
    
    revenue: {
      total: 945000,
      thisMonth: 945000,
      lastMonth: 920000,
      growth: 2.7,
    },
    
    payouts: [
      {
        id: "PO-103",
        description: "November Commission",
        amount: 92000,
        status: "paid",
        date: "2024-12-01",
      },
      {
        id: "PO-102",
        description: "October Commission",
        amount: 89500,
        status: "paid",
        date: "2024-11-01",
      },
    ],
    
    activity: [
      {
        id: "ACT-105",
        type: "payout",
        description: "Received November commission payout",
        timestamp: "2024-12-01T10:15:00",
      },
      {
        id: "ACT-104",
        type: "hostel",
        description: "Added new hostel: Campus View Hostel",
        timestamp: "2024-10-15T09:30:00",
      },
    ],
  };
};

export default function LandlordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: landlord, isLoading } = useQuery({
    queryKey: ["landlord", id],
    queryFn: () => getLandlordDetails(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-200 rounded" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!landlord) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Landlord Not Found</h2>
          <p className="text-slate-500 mb-4">
            The landlord you're looking for doesn't exist
          </p>
          <Button asChild>
            <Link href="/admin/users/landlords">Go Back</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users/landlords">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
              <AvatarImage src={landlord.profilePicture || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-2xl font-bold">
                {landlord.first_name[0]}
                {landlord.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {landlord.first_name} {landlord.last_name}
              </h1>
              <p className="text-slate-500 mt-1">{landlord.businessName}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge
                  className={
                    landlord.status === "verified"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-amber-100 text-amber-700 border-amber-200"
                  }
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {landlord.status}
                </Badge>
                <span className="text-sm text-slate-500">
                  Last active:{" "}
                  {new Date(landlord.lastActive).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Send Message</Button>
          <Button variant="outline" asChild>
            <Link href="/admin/users/landlords/verification">
              View Verification
            </Link>
          </Button>
          <Button variant="destructive">Suspend Account</Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Hostels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{landlord.hostels.length}</div>
            <p className="text-sm text-slate-500 mt-1">
              {landlord.hostels.reduce((acc, h) => acc + h.rooms, 0)} total rooms
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {landlord.revenue.thisMonth.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-sm text-emerald-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +{landlord.revenue.growth}% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (landlord.hostels.reduce((acc, h) => acc + h.occupancy, 0) /
                  landlord.hostels.reduce((acc, h) => acc + h.rooms, 0)) *
                  100
              )}
              %
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {landlord.hostels.reduce((acc, h) => acc + h.occupancy, 0)} /{" "}
              {landlord.hostels.reduce((acc, h) => acc + h.rooms, 0)} rooms
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Member Since
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(landlord.joinedAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hostels">Hostels</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{landlord.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="font-medium">{landlord.phone_number}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Joined</p>
                    <p className="font-medium">
                      {new Date(landlord.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Business Name</p>
                  <p className="font-medium">{landlord.businessName}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-slate-500">Registration Number</p>
                  <p className="font-medium">
                    {landlord.businessRegistrationNumber}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-slate-500">Business Address</p>
                  <p className="font-medium">{landlord.businessAddress}</p>
                </div>
<Separator />
                <div>
                  <p className="text-sm text-slate-500">Verification Status</p>
                  <Badge className="mt-1 bg-emerald-100 text-emerald-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hostels">
          <div className="grid gap-6 md:grid-cols-2">
            {landlord.hostels.map((hostel) => (
              <Card key={hostel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{hostel.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {hostel.location}
                      </CardDescription>
                    </div>
                    <Badge
                      className={
                        hostel.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }
                    >
                      {hostel.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Rooms</p>
                      <p className="text-2xl font-bold">{hostel.rooms}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Occupied</p>
                      <p className="text-2xl font-bold">{hostel.occupancy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Rate</p>
                      <p className="text-2xl font-bold">
                        {Math.round((hostel.occupancy / hostel.rooms) * 100)}%
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-slate-500">Monthly Revenue</p>
                    <p className="text-xl font-bold text-emerald-600">
                      KES {hostel.revenue.toLocaleString()}
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/admin/hostels/${hostel.id}`}>
                      View Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>Commission payouts to landlord</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {landlord.payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">{payout.id}</TableCell>
                      <TableCell>{payout.description}</TableCell>
                      <TableCell>
                        {new Date(payout.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        KES {payout.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {payout.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent account activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {landlord.activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 pb-4 border-b last:border-0"
                  >
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
