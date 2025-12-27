"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  Plus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserTable } from "@/features/admin";
import { useUsers, useUpdateUserStatus } from "@/features/users";
import { User } from '@/features/users';

export default function Page() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: techSupportUsers, isLoading } = useUsers({ 
    role: 'tech_support',
    search: searchTerm 
  });

  const updateUserStatus = useUpdateUserStatus();

  const handleViewDetails = (user: User) => {
    router.push(`/admin/users/${user.id}`);
  };

  const handleSuspendUser = (user: User) => {
      const newStatus = user.status === "suspended" ? "active" : "suspended";
      updateUserStatus.mutate({ id: user.id, status: newStatus });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tech Support</h1>
          <p className="mt-1 text-muted-foreground">Manage technical support staff.</p>
        </div>
        <div className="flex gap-2">
           <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            onClick={() => router.push('/admin/users/tech-support/new')}
           >
            <Plus className="mr-2 h-4 w-4" />
            Add Tech Support
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Staff Directory</CardTitle>
              <CardDescription>Browse and manage support team members</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
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
            <UserTable 
                users={techSupportUsers || []} 
                isLoading={isLoading} 
                onViewDetails={handleViewDetails}
                onSuspendUser={handleSuspendUser}
            />
        </CardContent>
      </Card>
    </div>
  );
}
