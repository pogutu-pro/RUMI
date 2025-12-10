"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Plus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserTable } from "@/components/admin/user-table";
import { useUsers, useUpdateUserStatus } from "@/hooks/use-users";
import { User } from "@/types/entities.types";

export default function Page() {
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Users</h1>
          <p className="mt-2 text-slate-500">Manage all platform users from a single view.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">All Users</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full" onValueChange={setRoleFilter}>
            <TabsList className="mb-4 bg-slate-100 p-1">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="student">Students</TabsTrigger>
              <TabsTrigger value="landlord">Landlords</TabsTrigger>
              <TabsTrigger value="caretaker">Caretakers</TabsTrigger>
              <TabsTrigger value="admin">Admins</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <UserTable 
                users={users || []} 
                isLoading={isLoading} 
                onViewDetails={() => {}} 
                onSuspendUser={handleSuspendUser} 
              />
            </TabsContent>
            <TabsContent value="student" className="mt-0">
              <UserTable 
                users={users || []} 
                isLoading={isLoading} 
                onViewDetails={() => {}} 
                onSuspendUser={handleSuspendUser} 
              />
            </TabsContent>
            <TabsContent value="landlord" className="mt-0">
              <UserTable 
                users={users || []} 
                isLoading={isLoading} 
                onViewDetails={() => {}} 
                onSuspendUser={handleSuspendUser} 
              />
            </TabsContent>
            <TabsContent value="caretaker" className="mt-0">
              <UserTable 
                users={users || []} 
                isLoading={isLoading} 
                onViewDetails={() => {}} 
                onSuspendUser={handleSuspendUser} 
              />
            </TabsContent>
            <TabsContent value="admin" className="mt-0">
              <UserTable 
                users={users || []} 
                isLoading={isLoading} 
                onViewDetails={() => {}} 
                onSuspendUser={handleSuspendUser} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
