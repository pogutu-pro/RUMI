"use client";

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  ShieldCheck,
  Users,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useTechSupportStore } from '@/features/support';
import { UserTable } from '@/features/support';
import { Badge } from '@/components/ui/badge';

interface UserManagementClientProps {
  initialTab: string;
}

export default function UserManagementClient({ initialTab }: UserManagementClientProps) {
  const { users, isLoadingUsers, fetchUsers } = useTechSupportStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone_number.includes(searchTerm);
    
    // In verification tab, maybe filter by !user.is_verified?
    // For now, keep role filter
    const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter;

    if (activeTab === 'verification') {
        // Simulate verification queue
        return matchesSearch && !user.is_verified;
    }

    return matchesSearch && matchesRole;
  });

  const handleVerify = (userId: string) => {
    console.log("Verify user", userId);
  };

  const handleToggleLock = (userId: string) => {
    console.log("Toggle lock", userId);
  };

  const handleViewProfile = (userId: string) => {
    console.log("View profile", userId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Search, verify identity, and manage access for all users.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="hidden md:flex">
             <Filter className="mr-2 h-4 w-4" />
             More Filters
           </Button>
           <Button variant="secondary" className="bg-background border border-input shadow-sm hover:bg-accent/50">
             <ShieldCheck className="mr-2 h-4 w-4 text-indigo-500" />
             Verification Queue
           </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
            <TabsTrigger value="directory" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Directory
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Verification Queue
            </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-4">
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Users Directory
                    </CardTitle>
                    <CardDescription>
                        Overview of students, landlords, and caretakers.
                    </CardDescription>
                    </div>
                    <Badge variant="outline" className="hidden md:flex bg-muted/50">
                    {filteredUsers.length} Total Users
                    </Badge>
                </div>
                </CardHeader>
                <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, email, or phone..." 
                        className="pl-9 bg-background/50 border-input/60 focus-visible:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px] bg-background/50 border-input/60">
                        <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="student">Students</SelectItem>
                        <SelectItem value="landlord">Landlords</SelectItem>
                        <SelectItem value="caretaker">Caretakers</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <UserTable 
                    users={filteredUsers} 
                    isLoading={isLoadingUsers} 
                    onVerify={handleVerify}
                    onToggleLock={handleToggleLock}
                    onViewProfile={handleViewProfile}
                />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle>Verification Queue</CardTitle>
                    <CardDescription>Users pending identity verification.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserTable 
                        users={filteredUsers} 
                        isLoading={isLoadingUsers} 
                        onVerify={handleVerify}
                        onToggleLock={handleToggleLock}
                        onViewProfile={handleViewProfile}
                    />
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
