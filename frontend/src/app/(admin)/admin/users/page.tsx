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
import { UserTable } from "@/features/admin";
import { useUsers, useUpdateUserStatus } from "@/features/users";
import { useHostels } from "@/features/hostels";
import { User } from '@/features/users';
import { cn } from "@/lib/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AddUserModal } from "@/features/admin";

export default function Page() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [hostelFilter, setHostelFilter] = useState<string>("all");
  
  const { data: hostels } = useHostels();

  const { data: users, isLoading } = useUsers({ 
    role: roleFilter === "all" ? undefined : roleFilter as User['role'],
    search: searchTerm,
    hostelId: hostelFilter === "all" ? undefined : hostelFilter
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
          <p className="mt-1 text-muted-foreground">Manage students, landlords, caretakers, and support staff.</p>
        </div>
        <div className="flex gap-2">
          <AddUserModal />
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">User Directory</CardTitle>
              <CardDescription>View and manage all system users</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
               <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={hostelFilter} onValueChange={setHostelFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by Hostel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hostels</SelectItem>
                  {hostels?.results?.map((hostel: any) => (
                    <SelectItem key={hostel.id} value={String(hostel.id)}>
                      {hostel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full" onValueChange={setRoleFilter}>
            <TabsList className="mb-4 bg-muted/50 p-1 flex flex-wrap h-auto">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="student">Students</TabsTrigger>
              <TabsTrigger value="landlord">Landlords</TabsTrigger>
              <TabsTrigger value="caretaker">Caretakers</TabsTrigger>
              <TabsTrigger value="tech_support">Tech Support</TabsTrigger>
              <TabsTrigger value="super_admin">Admins</TabsTrigger>
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
