"use client";

import React from 'react';
import { 
  MoreHorizontal, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Eye,
  CheckCircle2,
  XCircle
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TechSupportUser } from '@/lib/api/tech-support';

interface UserTableProps {
  users: TechSupportUser[];
  isLoading: boolean;
  onVerify: (userId: string) => void;
  onToggleLock: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}

export function UserTable({ users, isLoading, onVerify, onToggleLock, onViewProfile }: UserTableProps) {
  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading users...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{user.first_name} {user.last_name}</span>
                  <span className="text-xs text-slate-500">{user.email}</span>
                  <span className="text-xs text-slate-500">{user.phone_number}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={
                  user.is_active ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"
                }>
                  {user.is_active ? 'Active' : 'Suspended'}
                </Badge>
              </TableCell>
              <TableCell>
                {user.is_verified ? (
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Verified
                  </div>
                ) : (
                  <div className="flex items-center text-slate-500 text-sm">
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Unverified
                  </div>
                )}
              </TableCell>
              <TableCell className="text-slate-500 text-sm">
                {user.date_joined}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewProfile(user.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    {!user.is_verified && (
                      <DropdownMenuItem onClick={() => onVerify(user.id)}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Verify Identity
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className={user.is_active ? "text-red-600" : "text-green-600"}
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
