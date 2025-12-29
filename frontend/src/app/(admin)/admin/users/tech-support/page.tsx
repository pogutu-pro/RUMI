"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Plus,
  LifeBuoy,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Trash2,
  ShieldAlert
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
import { useTechSupportUsers } from "@/features/users";
import { useDeleteUser } from "@/features/users"; // Using generic delete
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function TechSupportPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const { data: usersResponse, isLoading } = useTechSupportUsers({ 
    search: searchTerm 
  });

  const deleteUserMutation = useDeleteUser();

  const users = usersResponse?.results || usersResponse?.data || [];

  const handleDelete = () => {
      if(userToDelete) {
          deleteUserMutation.mutate(userToDelete, {
              onSuccess: () => {
                  toast.success("User deactivated successfully");
                  setUserToDelete(null);
              },
              onError: () => {
                  toast.error("Failed to deactivate user");
              }
          });
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LifeBuoy className="h-8 w-8 text-primary" />
            Tech Support
          </h1>
          <p className="mt-1 text-muted-foreground">Manage technical support staff and access.</p>
        </div>
        <div className="flex gap-2">
           <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
            onClick={() => router.push('/admin/users/tech-support/new')}
           >
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Staff Directory</CardTitle>
              <CardDescription>Browse and manage support team members</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9 bg-background border-border/60 focus:border-primary/50 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 rounded-xl bg-muted/40 animate-pulse" />
                    ))}
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No tech support staff found.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {users.map((user: any) => (
                        <Card key={user.id} className="group hover:shadow-md transition-shadow duration-200 border-border/60 overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                            <AvatarImage src={user.profile_picture || user.avatar} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                {user.first_name} {user.last_name}
                                            </h3>
                                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="mt-1 h-5 px-1.5 text-[10px] pointer-events-none">
                                                {user.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                                                View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setUserToDelete(user.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Deactivate
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                
                                <div className="mt-6 space-y-2.5">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="h-3.5 w-3.5" />
                                        <span>{user.phone_number || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>Joined {user.created_at ? format(new Date(user.created_at), 'MMM yyyy') : 'Recently'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will deactivate the user's account and prevent them from accessing the system.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Deactivate
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
