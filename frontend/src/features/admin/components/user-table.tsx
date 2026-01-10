"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, User, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import type { User as UserType } from "@/types/entities.types";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface UserTableProps {
  users: UserType[];
  isLoading: boolean;
  onViewDetails: (user: UserType) => void;
  onSuspendUser: (user: UserType) => void;
}

export function UserTable({ users, isLoading, onViewDetails, onSuspendUser }: UserTableProps) {
  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-muted-foreground">
        Loading users...
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Hostel</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onViewDetails(user)}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center transition-colors",
                    (user.role === 'super_admin' || user.role === 'tech_support_admin') ? "bg-primary/10 text-primary" : 
                    user.role === 'tech_support' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" :
                    "bg-secondary text-secondary-foreground"
                  )}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={`${user.first_name} ${user.last_name}`} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{user.first_name} {user.last_name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {(user.role === 'super_admin' || user.role === 'tech_support_admin') && <ShieldAlert className="w-3.5 h-3.5 text-primary" />}
                  {user.role === 'landlord' && <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  {user.role === 'caretaker' && <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                  {user.role === 'tech_support' && <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                  <span className="capitalize text-sm text-foreground">{user.role === 'tech_support' ? 'Tech Support' : user.role.replace(/_/g, ' ')}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize font-medium",
                    user.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                      : user.status === "suspended"
                      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                  )}
                >
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {(user as any).hostel_name || '-'}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : '-'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails(user); }}>
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className={cn(user.status === "suspended" ? "text-emerald-600" : "text-destructive")}
                      onClick={(e) => { e.stopPropagation(); onSuspendUser(user); }}
                    >
                      {user.status === "suspended" ? "Reactivate" : "Suspend"} account
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
