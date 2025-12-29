"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  Building2,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Ban,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAdminLandlords } from "@/features/admin";
import { useUpdateUserStatus } from "@/features/users";
import { getLandlordApplications } from "@/features/admin";
import { useQuery } from "@tanstack/react-query";

export default function LandlordsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: landlordsResponse, isLoading } = useAdminLandlords({ 
    search: searchTerm 
  });

  const { data: verifications = [] } = useQuery({
      queryKey: ["landlord-applications"],
      queryFn: getLandlordApplications,
  });

  const updateUserStatus = useUpdateUserStatus();
  const landlords = landlordsResponse?.results || landlordsResponse?.data || [];
  const pendingVerifications = verifications.filter((v: any) => v.status === 'pending');

  const handleSuspendUser = (user: any) => {
      const newStatus = user.status === "suspended" ? "active" : "suspended";
      updateUserStatus.mutate({ id: user.id, status: newStatus });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Landlords
          </h1>
          <p className="mt-1 text-muted-foreground">Oversee landlord accounts and property portfolios.</p>
        </div>
        <div className="flex gap-2">
           <Button 
            variant="outline"
            className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
            onClick={() => router.push('/admin/users/landlords/verification')}
           >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Verifications
            {pendingVerifications.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-amber-500 text-white hover:bg-amber-600 border-none h-5 px-1.5 min-w-[1.25rem] justify-center">
                    {pendingVerifications.length}
                </Badge>
            )}
           </Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Landlord Directory</CardTitle>
              <CardDescription>Browse all registered landlords</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="Search landlords..."
                    className="pl-9 bg-background border-border/60 focus:border-primary/50 transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="shrink-0">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-40 rounded-xl bg-muted/40 animate-pulse" />
                    ))}
                </div>
            ) : landlords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No landlords found.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {landlords.map((landlord: any) => (
                        <Card key={landlord.id} className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30 overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                     <div className="relative">
                                         <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                                            <AvatarImage src={landlord.profile_picture || landlord.avatar} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xl">
                                                {landlord.first_name?.[0]}{landlord.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        {landlord.is_verified && (
                                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
                                            </div>
                                        )}
                                     </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.push(`/admin/users/${landlord.id}`)}>
                                                View Profile
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => router.push(`/admin/hostels?landlord=${landlord.id}`)}>
                                                View Properties
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleSuspendUser(landlord)} className={landlord.status === 'active' ? "text-destructive focus:text-destructive" : "text-emerald-600 focus:text-emerald-600"}>
                                                {landlord.status === 'active' ? (
                                                    <><Ban className="mr-2 h-4 w-4" /> Suspend User</>
                                                ) : (
                                                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Activate User</>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                        {landlord.first_name} {landlord.last_name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={landlord.status === 'active' ? 'default' : 'secondary'} className="h-5 px-1.5 text-[10px] pointer-events-none capitalize">
                                            {landlord.status}
                                        </Badge>
                                        {landlord.is_verified && <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800">Verified</Badge>}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2 pt-4 border-t border-border/50">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5 opacity-70" />
                                        <span className="truncate">{landlord.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone className="h-3.5 w-3.5 opacity-70" />
                                        <span>{landlord.phone_number || 'N/A'}</span>
                                    </div>
                                     <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5 opacity-70" />
                                        <span>Joined {landlord.created_at ? format(new Date(landlord.created_at), 'MMM yyyy') : '-'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
