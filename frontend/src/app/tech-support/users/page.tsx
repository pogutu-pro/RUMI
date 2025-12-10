"use client";

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  ShieldCheck
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
import { useTechSupportStore } from '@/stores/tech-support.store';
import { UserTable } from '@/components/tech-support/user-table';

export default function UserManagementPage() {
  const { users, isLoadingUsers, fetchUsers } = useTechSupportStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone_number.includes(searchTerm);
    
    const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter;

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Search, verify, and manage user accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline">
             <Filter className="mr-2 h-4 w-4" />
             Advanced Filters
           </Button>
           <Button>
             <ShieldCheck className="mr-2 h-4 w-4" />
             Verification Queue
           </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Users Directory</CardTitle>
          <CardDescription>
            Manage student and landlord accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search by name, email, or phone..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="landlord">Landlords</SelectItem>
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
    </div>
  );
}
