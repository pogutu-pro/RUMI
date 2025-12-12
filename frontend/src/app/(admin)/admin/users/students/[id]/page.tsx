"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  Calendar,
  CreditCard,
  Activity,
  AlertCircle,
  CheckCircle,
  Home,
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
const getStudentDetails = async (id: string) => {
  // Mock data for now
  return {
    id,
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@university.edu",
    phone_number: "+254 712 345 678",
    university: "University of Nairobi",
    course: "Computer Science",
    year: "3rd Year",
    studentId: "SCT/2021/12345",
    status: "active",
    joinedAt: "2024-01-15",
    lastActive: "2024-12-08T10:30:00",
    profilePicture: null,
    
    currentBooking: {
      id: "BK-001",
      hostel: "Sunshine Hostel",
      roomNumber: "R-205",
      moveInDate: "2024-09-01",
      monthlyRent: 15000,
      status: "active",
    },
    
    bookingHistory: [
      {
        id: "BK-001",
        hostel: "Sunshine Hostel",
        roomNumber: "R-205",
        moveInDate: "2024-09-01",
        moveOutDate: null,
        status: "active",
      },
      {
        id: "BK-000",
        hostel: "Campus View",
        roomNumber: "R-101",
        moveInDate: "2023-09-01",
        moveOutDate: "2024-08-31",
        status: "completed",
      },
    ],
    
    payments: [
      {
        id: "PAY-103",
        description: "Rent - December 2024",
        amount: 15000,
        status: "paid",
        date: "2024-12-01",
      },
      {
        id: "PAY-102",
        description: "Rent - November 2024",
        amount: 15000,
        status: "paid",
        date: "2024-11-01",
      },
      {
        id: "PAY-101",
        description: "Rent - October 2024",
        amount: 15000,
        status: "paid",
        date: "2024-10-01",
      },
    ],
    
    activity: [
      {
        id: "ACT-005",
        type: "payment",
        description: "Paid December 2024 rent",
        timestamp: "2024-12-01T09:15:00",
      },
      {
        id: "ACT-004",
        type: "booking",
        description: "Checked into room R-205",
        timestamp: "2024-09-01T14:00:00",
      },
      {
        id: "ACT-003",
        type: "profile",
        description: "Updated profile picture",
        timestamp: "2024-08-15T11:20:00",
      },
    ],
  };
};

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: () => getStudentDetails(id),
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

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Student Not Found</h2>
          <p className="text-slate-500 mb-4">
            The student you're looking for doesn't exist
          </p>
          <Button asChild>
            <Link href="/admin/users/students">Go Back</Link>
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
            <Link href="/admin/users/students">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
              <AvatarImage src={student.profilePicture || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-blue-500 text-white text-2xl font-bold">
                {student.first_name[0]}
                {student.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-slate-500 mt-1">{student.email}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge
                  className={
                    student.status === "active"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  }
                >
                  {student.status}
                </Badge>
                <span className="text-sm text-slate-500">
                  Last active:{" "}
                  {new Date(student.lastActive).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Send Message</Button>
          <Button variant="destructive">Suspend Account</Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Student ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.studentId}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Current Rent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {student.currentBooking?.monthlyRent.toLocaleString()}
            </div>
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
              {new Date(student.joinedAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="text-2xl font-bold">Up to Date</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Booking History</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{student.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="font-medium">{student.phone_number}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">University</p>
                    <p className="font-medium">{student.university}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Course & Year</p>
                    <p className="font-medium">
                      {student.course} - {student.year}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Accommodation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-emerald-600" />
                  Current Accommodation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.currentBooking ? (
                  <>
                    <div>
                      <p className="text-sm text-slate-500">Hostel</p>
                      <p className="font-medium text-lg">
                        {student.currentBooking.hostel}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-slate-500">Room Number</p>
                      <p className="font-medium">
                        {student.currentBooking.roomNumber}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-slate-500">Move-in Date</p>
                      <p className="font-medium">
                        {new Date(
                          student.currentBooking.moveInDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-slate-500">Monthly Rent</p>
                      <p className="font-medium text-lg">
                        KES {student.currentBooking.monthlyRent.toLocaleString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500 text-center py-8">
                    No active booking
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
              <CardDescription>
                All past and current hostel bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Move-in</TableHead>
                    <TableHead>Move-out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.bookingHistory.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.id}</TableCell>
                      <TableCell>{booking.hostel}</TableCell>
                      <TableCell>{booking.roomNumber}</TableCell>
                      <TableCell>
                        {new Date(booking.moveInDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {booking.moveOutDate
                          ? new Date(booking.moveOutDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            booking.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All transactions and payments</CardDescription>
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
                  {student.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell>
                        {new Date(payment.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        KES {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {payment.status}
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
                {student.activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-5 w-5 text-emerald-600" />
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
