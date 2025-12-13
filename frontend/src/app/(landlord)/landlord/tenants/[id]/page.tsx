"use client";

import * as React from 'react';
import { useParams } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  CreditCard,
  Building2,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUser } from '@/features/users'; 
import { useBookings } from '@/features/bookingss';

export default function TenantProfilePage() {
  const { id } = useParams();
  
  // Fetch user
  const { data: user, isLoading: userLoading } = useUser(id as string);
  
  // Fetch bookings for this user (mocking filtering by student for now if useBookings doesnt support it, but it likely does on backend)
  // We'll just fetch all and filter client side for demo
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings();
  
  const userBookings = bookingsData?.filter((b: any) => 
     (typeof b.student === 'object' && b.student.id === id) || 
     (typeof b.student === 'string' && b.student === id)
  ) || [];

  if (userLoading) return <div className="p-8"><Skeleton className="h-[300px] w-full" /></div>;
  if (!user) return <div className="p-8">Tenant not found</div>;

  const currentBooking = userBookings.find((b: any) => b.status === 'confirmed');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
       {/* Profile Header */}
       <Card className="border-none shadow-md overflow-hidden">
           <div className="h-32 bg-gradient-to-r from-emerald-600 to-cyan-600" />
           <CardContent className="relative pt-0 px-8 pb-8">
               <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-12 mb-6">
                   <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-900 shadow-lg">
                       <AvatarImage src={user.profile_picture} />
                       <AvatarFallback className="bg-slate-200 text-3xl font-bold">{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                   </Avatar>
                   <div className="flex-1 space-y-2 mb-2">
                       <h1 className="text-3xl font-bold text-slate-900 dark:text-white capitalize">{user.first_name} {user.last_name}</h1>
                       <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                           <div className="flex items-center gap-1.5">
                               <Mail className="h-4 w-4" />
                               {user.email}
                           </div>
                           <div className="flex items-center gap-1.5">
                               <Phone className="h-4 w-4" />
                               {user.phone_number || 'N/A'}
                           </div>
                           <div className="flex items-center gap-1.5">
                               <MapPin className="h-4 w-4" />
                               {currentBooking ? (currentBooking.hostel as any).name : 'No Active Residence'}
                           </div>
                       </div>
                   </div>
                   <div className="flex gap-3 mb-2">
                       <Button variant="outline">Send Message</Button>
                       <Button className="bg-emerald-600 hover:bg-emerald-700">Edit Profile</Button>
                   </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-t pt-6">
                   <div className="space-y-1">
                       <p className="text-sm font-medium text-slate-500">Tenant Status</p>
                       <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">
                           {currentBooking ? 'Active Resident' : 'Past Tenant'}
                       </Badge>
                   </div>
                   <div className="space-y-1">
                       <p className="text-sm font-medium text-slate-500">Joined Date</p>
                       <p className="font-semibold text-slate-900 dark:text-white">
                           {format(new Date(user.date_joined || new Date()), 'MMM dd, yyyy')}
                       </p>
                   </div>
                   <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Lease Ends</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                            {currentBooking ? 'Dec 31, 2024' : 'N/A'}
                        </p>
                   </div>
                   <div className="space-y-1">
                       <p className="text-sm font-medium text-slate-500">Payment Standing</p>
                       <span className="text-emerald-600 font-bold flex items-center gap-1">
                           <CreditCard className="h-4 w-4" />
                           Good
                       </span>
                   </div>
               </div>
           </CardContent>
       </Card>

       <Tabs defaultValue="overview" className="space-y-6">
           <TabsList>
               <TabsTrigger value="overview">Overview</TabsTrigger>
               <TabsTrigger value="bookings">Booking History</TabsTrigger>
               <TabsTrigger value="payments">Payments</TabsTrigger>
               <TabsTrigger value="documents">Documents</TabsTrigger>
           </TabsList>

           <TabsContent value="overview" className="space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                   <Card>
                       <CardHeader>
                           <CardTitle>Current Residence</CardTitle>
                       </CardHeader>
                       <CardContent>
                           {currentBooking ? (
                               <div className="space-y-4">
                                   <div className="flex items-center gap-4">
                                       <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                           <Building2 className="h-6 w-6" />
                                       </div>
                                       <div>
                                           <h3 className="font-bold">{(currentBooking.hostel as any).name}</h3>
                                           <p className="text-sm text-slate-500">Room {(currentBooking.room as any).number || 'Unknown'}</p>
                                       </div>
                                   </div>
                                   <div className="grid grid-cols-2 gap-4 text-sm">
                                       <div className="p-3 bg-slate-50 rounded-lg">
                                           <span className="text-slate-500 block text-xs">Monthly Rent</span>
                                           <span className="font-bold">KES {(currentBooking.room as any).price || '0'}</span>
                                       </div>
                                       <div className="p-3 bg-slate-50 rounded-lg">
                                           <span className="text-slate-500 block text-xs">Lease Term</span>
                                           <span className="font-bold">6 Months</span>
                                       </div>
                                   </div>
                               </div>
                           ) : (
                               <div className="text-center py-6 text-slate-500">No active residence found.</div>
                           )}
                       </CardContent>
                   </Card>

                   <Card>
                       <CardHeader>
                           <CardTitle>Notes</CardTitle>
                       </CardHeader>
                       <CardContent>
                           <p className="text-sm text-slate-600 italic">
                               "Quiet tenant, always pays rent on time. Reported one issue with tap which was fixed."
                           </p>
                           <Button variant="link" className="px-0 mt-2 text-emerald-600">Edit Notes</Button>
                       </CardContent>
                   </Card>
               </div>
           </TabsContent>

           <TabsContent value="bookings">
               <Card>
                   <CardContent className="p-6 space-y-4">
                       {userBookings.map((booking: any) => (
                           <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                               <div>
                                   <p className="font-semibold">{(booking.hostel as any).name}</p>
                                   <p className="text-sm text-slate-500">{format(new Date(booking.check_in_date), 'MMM yyyy')} - Present</p>
                               </div>
                               <Badge variant="outline">{booking.status}</Badge>
                           </div>
                       ))}
                       {userBookings.length === 0 && <p className="text-slate-500">No booking history.</p>}
                   </CardContent>
               </Card>
           </TabsContent>
           <TabsContent value="documents">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 bg-white shadow-sm mb-3">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-red-500" />
                                <div>
                                    <p className="font-medium text-sm">Lease_Agreement_Signed.pdf</p>
                                    <p className="text-xs text-slate-500">Uploaded {currentBooking ? format(new Date(currentBooking.created_at), 'MMM dd') : 'N/A'}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">Download</Button>
                        </div>
                         <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 bg-white shadow-sm">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="font-medium text-sm">ID_Copy_Front.jpg</p>
                                    <p className="text-xs text-slate-500">Uploaded {currentBooking ? format(new Date(currentBooking.created_at), 'MMM dd') : 'N/A'}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">Download</Button>
                        </div>
                    </CardContent>
                </Card>
           </TabsContent>
       </Tabs>
    </div>
  );
}
