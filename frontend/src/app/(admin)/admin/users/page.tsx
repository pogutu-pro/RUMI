"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  Plus,
  Users
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserTable } from "@/components/admin/user-table";
import { useUsers, useUpdateUserStatus } from "@/hooks/use-users";
import { User } from "@/types/entities.types";
import { cn } from "@/lib/utils/cn";

export default function Page() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  const { data: users, isLoading } = useUsers({ 
    role: roleFilter === "all" ? undefined : roleFilter as User['role'],
    search: searchTerm 
  });

  const updateUserStatus = useUpdateUserStatus();

  const handleSuspendUser = (user: User) => {
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    updateUserStatus.mutate({ id: user.id, status: newStatus });
  };

  const handleViewDetails = (user: User) => {
    router.push(`/admin/users/${user.id}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="mt-1 text-muted-foreground">Manage students, landlords, and caretakers.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">All Users</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full" onValueChange={setRoleFilter}>
            <TabsList className="mb-4 bg-muted/50 p-1">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="student">Students</TabsTrigger>
              <TabsTrigger value="landlord">Landlords</TabsTrigger>
              <TabsTrigger value="caretaker">Caretakers</TabsTrigger>
              <TabsTrigger value="admin">Admins</TabsTrigger>
            </TabsList>
            
            <div className="relative min-h-[400px]">
               <UserTable 
                  users={users || []} 
                  isLoading={isLoading} 
                  onViewDetails={handleViewDetails} 
                  onSuspendUser={handleSuspendUser} 
                />
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
