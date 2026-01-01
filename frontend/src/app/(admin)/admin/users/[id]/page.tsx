"use client";

import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  MoreVertical,
  Building2,
  FileText,
  CreditCard,
  Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useUpdateUserStatus } from "@/features/users";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const { data: user, isLoading } = useUser(id);
  const updateUserStatus = useUpdateUserStatus();

  if (isLoading) {
    return (
      <div className="space-y-8">
         <div className="flex items-center gap-4">
             <Skeleton className="h-10 w-10 rounded-full" />
             <Skeleton className="h-8 w-48" />
         </div>
         <div className="grid gap-6 md:grid-cols-3">
             <Skeleton className="h-64 md:col-span-1 rounded-xl" />
             <Skeleton className="h-64 md:col-span-2 rounded-xl" />
         </div>
      </div>
    );
  }

  if (!user) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <h2 className="text-2xl font-bold text-foreground">User Not Found</h2>
              <p className="text-muted-foreground mt-2">The user you are looking for does not exist or has been deleted.</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/users')}>
                  Back to Users
              </Button>
          </div>
      )
  }

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  const initials = fullName ? fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??';

  const handleStatusChange = () => {
      const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
      updateUserStatus.mutate({ id: user.id, status: newStatus });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <Button 
            variant="ghost" 
            className="mb-4 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground group"
            onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Users
        </Button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
           <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                  <AvatarImage src={user.avatar} alt={fullName} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div>
                  <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold tracking-tight text-foreground">{fullName}</h1>
                       <Badge 
                           variant="outline"
                           className={cn(
                            "capitalize",
                            user.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : user.status === "suspended"
                              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"
                          )}
                       >
                           {user.status}
                       </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-muted-foreground text-sm">
                      <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          {user.email}
                      </div>
                      {user.phone_number && (
                          <div className="flex items-center gap-1.5">
                              <Phone className="w-4 h-4" />
                              {user.phone_number}
                          </div>
                      )}
                      <div className="flex items-center gap-1.5">
                          <Shield className="w-4 h-4" />
                          <span className="capitalize">{user.role}</span>
                      </div>
                  </div>
              </div>
           </div>

           <div className="flex gap-2">
               <Button variant="outline">Edit Profile</Button>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive" onClick={handleStatusChange}>
                        {user.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 md:grid-cols-3">
         {/* Sidebar Info */}
         <Card className="border-border/50 shadow-sm md:col-span-1 h-fit">
            <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">User ID</p>
                    <p className="text-sm font-mono bg-muted/50 p-1 rounded w-fit">{user.id}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Joined Date</p>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {user.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'N/A'}
                    </div>
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Last Active</p>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {user.last_login ? format(new Date(user.last_login), 'MMM d, yyyy HH:mm') : 'Never'}
                    </div>
                </div>
            </CardContent>
         </Card>

         {/* Main Tabs */}
         <Card className="border-border/50 shadow-sm md:col-span-2">
            <CardHeader className="pb-0">
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="mb-4 bg-muted/50 w-full justify-start">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="activity">Activity Log</TabsTrigger>
                        {user.role === 'student' && <TabsTrigger value="bookings">Bookings</TabsTrigger>}
                        {user.role === 'landlord' && <TabsTrigger value="properties">Properties</TabsTrigger>}
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-6 pb-6">
                        <div className="grid gap-4 md:grid-cols-2">
                             <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                                 <div className="flex items-center gap-3 mb-2">
                                     <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <Shield className="w-4 h-4" />
                                     </div>
                                     <h3 className="font-semibold">Account Status</h3>
                                 </div>
                                 <p className="text-sm text-muted-foreground">
                                     Account is currently <span className="font-medium text-foreground">{user.status}</span>. 
                                     {user.status === 'active' ? ' User has full access.' : ' Access is restricted.'}
                                 </p>
                             </div>
                             {/* Add more widgets based on role */}
                             {user.role === 'landlord' && (
                                 <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                     <div className="flex items-center gap-3 mb-2">
                                         <div className="p-2 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
                                            <Building2 className="w-4 h-4" />
                                         </div>
                                         <h3 className="font-semibold">Properties</h3>
                                     </div>
                                     <p className="text-sm text-muted-foreground">
                                         Manage listing verification and status in the Properties tab.
                                     </p>
                                 </div>
                             )}
                        </div>
                    </TabsContent>

                    <TabsContent value="activity" className="pb-6">
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <div className="p-4 bg-muted/30 rounded-full mb-4">
                                <FileText className="w-8 h-8 opacity-50" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No recent activity</h3>
                            <p className="max-w-sm mt-2 text-sm">
                                This user hasn't performed any actions recently.
                            </p>
                        </div>
                    </TabsContent>

                    {/* Conditional Tabs Content */}
                    <TabsContent value="bookings" className="pb-6">
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <p>No booking history found.</p>
                        </div>
                    </TabsContent>

                     <TabsContent value="properties" className="pb-6">
                         <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <p>No properties listed.</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardHeader>
         </Card>
      </div>
    </div>
  );
}
