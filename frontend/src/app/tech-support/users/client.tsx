"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  ShieldCheck,
  Users,
  UserCheck,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle
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
import { 
  useSupportUsers, 
  useVerificationQueue,
  useVerifyUser,
  useToggleUserLock 
} from '@/features/support/hooks/use-support';
import { useSupportStats } from '@/features/support/hooks/use-support';
import { UserTable, UserProfileDialog } from '@/features/support';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { TechSupportUser } from '@/features/support/api/tech-support';

interface UserManagementClientProps {
  initialTab: string;
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  isLoading,
  colorClass = "text-primary"
}: { 
  title: string; 
  value: number | string; 
  icon: React.ElementType;
  trend?: string;
  isLoading?: boolean;
  colorClass?: string;
}) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg transition-all duration-300 group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight mt-1 text-foreground">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-background/50 ${colorClass}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserManagementClient({ initialTab }: UserManagementClientProps) {
  // State
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Debounce search for performance
  const debouncedSearch = useDebounce(searchTerm, 300);

  // API Queries
  const { data: usersResponse, isLoading: isLoadingUsers, refetch: refetchUsers } = useSupportUsers({
    search: debouncedSearch || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    is_active: statusFilter === 'active' ? true : statusFilter === 'suspended' ? false : undefined,
  });
  
  const { data: verificationResponse, isLoading: isLoadingVerification, refetch: refetchVerification } = useVerificationQueue({
    role: roleFilter !== 'all' ? roleFilter : undefined,
  });

  const { data: statsResponse, isLoading: isLoadingStats } = useSupportStats();

  // Mutations
  const verifyMutation = useVerifyUser();
  const toggleLockMutation = useToggleUserLock();

  // Computed data
  const users = useMemo(() => usersResponse?.data || [], [usersResponse]);
  const verificationQueue = useMemo(() => verificationResponse?.data || [], [verificationResponse]);
  const stats = statsResponse?.data;

  // Filter verification queue by search
  const filteredVerificationQueue = useMemo(() => {
    if (!debouncedSearch) return verificationQueue;
    const searchLower = debouncedSearch.toLowerCase();
    return verificationQueue.filter((user: TechSupportUser) =>
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.phone_number?.includes(debouncedSearch)
    );
  }, [verificationQueue, debouncedSearch]);

  // Handlers
  const handleVerify = useCallback(async (userId: string) => {
    await verifyMutation.mutateAsync(userId);
  }, [verifyMutation]);

  const handleToggleLock = useCallback(async (userId: string) => {
    const user = users.find((u: TechSupportUser) => u.id === userId);
    const reason = user?.is_active ? 'Suspended by tech support' : 'Reactivated by tech support';
    await toggleLockMutation.mutateAsync({ userId, reason });
  }, [toggleLockMutation, users]);

  const handleViewProfile = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setProfileDialogOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    if (activeTab === 'verification') {
      refetchVerification();
    } else {
      refetchUsers();
    }
  }, [activeTab, refetchUsers, refetchVerification]);

  // Stats values
  const totalUsers = stats?.total_users || users.length;
  const activeUsers = stats?.active_users || users.filter((u: TechSupportUser) => u.is_active).length;
  const pendingVerifications = stats?.pending_verifications || verificationQueue.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            User Support
          </h1>
          <p className="text-muted-foreground mt-1">
            Search, verify identity, and manage access for all platform users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingUsers || isLoadingVerification}
            className="border-border/50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${(isLoadingUsers || isLoadingVerification) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          isLoading={isLoadingStats}
          colorClass="text-blue-500"
        />
        <StatCard
          title="Active Users"
          value={activeUsers}
          icon={CheckCircle2}
          isLoading={isLoadingStats}
          colorClass="text-emerald-500"
        />
        <StatCard
          title="Pending Verifications"
          value={pendingVerifications}
          icon={Clock}
          isLoading={isLoadingStats}
          colorClass="text-amber-500"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="directory" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            User Directory
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <UserCheck className="h-4 w-4" />
            Verification Queue
            {pendingVerifications > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-amber-500/10 text-amber-600">
                {pendingVerifications}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* User Directory Tab */}
        <TabsContent value="directory" className="space-y-4">
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-card/95">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Users className="h-5 w-5 text-primary" />
                    All Users
                  </CardTitle>
                  <CardDescription>
                    Students, landlords, and caretakers on the platform.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="hidden md:flex bg-muted/50 text-foreground border-border">
                  {users.length} Users
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name, email, or phone..." 
                    className="pl-10 bg-background/50 border-border/60 focus-visible:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-[160px] bg-background/50 border-border/60">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="landlord">Landlords</SelectItem>
                    <SelectItem value="caretaker">Caretakers</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[160px] bg-background/50 border-border/60">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <UserTable 
                users={users as TechSupportUser[]} 
                isLoading={isLoadingUsers} 
                onVerify={handleVerify}
                onToggleLock={handleToggleLock}
                onViewProfile={handleViewProfile}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Queue Tab */}
        <TabsContent value="verification" className="space-y-4">
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-card/95">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <ShieldCheck className="h-5 w-5 text-amber-500" />
                    Verification Queue
                  </CardTitle>
                  <CardDescription>
                    Users awaiting identity verification.
                  </CardDescription>
                </div>
                {pendingVerifications > 0 && (
                  <Badge className="hidden md:flex bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {pendingVerifications} Pending
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Search for verification queue */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search pending verifications..." 
                    className="pl-10 bg-background/50 border-border/60 focus-visible:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-[160px] bg-background/50 border-border/60">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="landlord">Landlords</SelectItem>
                    <SelectItem value="caretaker">Caretakers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredVerificationQueue.length === 0 && !isLoadingVerification ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">All Caught Up!</h3>
                  <p className="text-muted-foreground">No users pending verification.</p>
                </div>
              ) : (
                <UserTable 
                  users={filteredVerificationQueue as TechSupportUser[]} 
                  isLoading={isLoadingVerification} 
                  onVerify={handleVerify}
                  onToggleLock={handleToggleLock}
                  onViewProfile={handleViewProfile}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Profile Dialog */}
      <UserProfileDialog
        userId={selectedUserId}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onUserUpdate={() => {
          refetchUsers();
          refetchVerification();
        }}
      />
    </div>
  );
}
