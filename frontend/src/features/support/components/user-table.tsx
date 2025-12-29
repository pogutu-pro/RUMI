"use client";

import React from 'react';
import { 
  MoreHorizontal, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Eye,
  CheckCircle2,
  XCircle,
  Users
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TechSupportUser } from '@/features/support/api/tech-support';
import { format } from 'date-fns';

interface UserTableProps {
  users: TechSupportUser[];
  isLoading: boolean;
  onVerify: (userId: string) => void;
  onToggleLock: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}

// Loading skeleton component
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-border/50">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No Users Found</h3>
      <p className="text-muted-foreground text-sm">
        Try adjusting your search or filters.
      </p>
    </div>
  );
}

export function UserTable({ users, isLoading, onVerify, onToggleLock, onViewProfile }: UserTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!users || users.length === 0) {
    return <EmptyState />;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'student':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'landlord':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'caretaker':
        return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="font-semibold text-foreground">User</TableHead>
            <TableHead className="font-semibold text-foreground">Role</TableHead>
            <TableHead className="font-semibold text-foreground">Status</TableHead>
            <TableHead className="font-semibold text-foreground">Verification</TableHead>
            <TableHead className="font-semibold text-foreground">Joined</TableHead>
            <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow 
              key={user.id} 
              className="group hover:bg-muted/20 transition-colors"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border/50">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-semibold">
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground truncate">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    {user.phone_number && (
                      <span className="text-xs text-muted-foreground">{user.phone_number}</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`capitalize ${getRoleColor(user.role)}`}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="secondary" 
                  className={
                    user.is_active 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                      : "bg-red-500/10 text-red-600 border-red-500/20"
                  }
                >
                  {user.is_active ? 'Active' : 'Suspended'}
                </Badge>
              </TableCell>
              <TableCell>
                {user.is_verified ? (
                  <div className="flex items-center text-emerald-600 text-sm font-medium">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Verified
                  </div>
                ) : (
                  <div className="flex items-center text-amber-600 text-sm">
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Pending
                  </div>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(user.date_joined)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewProfile(user.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    {!user.is_verified && (
                      <DropdownMenuItem 
                        onClick={() => onVerify(user.id)}
                        className="text-emerald-600 focus:text-emerald-600"
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Verify Identity
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className={user.is_active ? "text-red-600 focus:text-red-600" : "text-emerald-600 focus:text-emerald-600"}
                      onClick={() => onToggleLock(user.id)}
                    >
                      {user.is_active ? (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Suspend Account
                        </>
                      ) : (
                        <>
                          <Unlock className="mr-2 h-4 w-4" />
                          Unlock Account
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
