"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useUserProfile, useVerifyUser, useToggleUserLock, useResetUserPassword } from '@/features/support/hooks/use-support';
import { TechSupportUser } from '@/features/support/api/tech-support';
import { format } from 'date-fns';

interface UserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdate?: () => void;
}

export function UserProfileDialog({ userId, open, onOpenChange, onUserUpdate }: UserProfileDialogProps) {
  const { data: profileResponse, isLoading } = useUserProfile(userId || '');
  const verifyMutation = useVerifyUser();
  const toggleLockMutation = useToggleUserLock();
  const resetPasswordMutation = useResetUserPassword();

  const user = profileResponse?.data as TechSupportUser | undefined;

  const handleVerify = async () => {
    if (!userId) return;
    await verifyMutation.mutateAsync(userId);
    onUserUpdate?.();
  };

  const handleToggleLock = async () => {
    if (!userId || !user) return;
    const reason = user.is_active ? 'Suspended by tech support' : 'Reactivated by tech support';
    await toggleLockMutation.mutateAsync({ userId, reason });
    onUserUpdate?.();
  };

  const handleResetPassword = async () => {
    if (!userId) return;
    await resetPasswordMutation.mutateAsync(userId);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>View and manage user details</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xl font-bold">
                  {getInitials(user.first_name, user.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground truncate">
                  {user.first_name} {user.last_name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="capitalize">
                    {user.role}
                  </Badge>
                  <Badge 
                    variant={user.is_active ? "default" : "destructive"}
                    className={user.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
                  >
                    {user.is_active ? 'Active' : 'Suspended'}
                  </Badge>
                  {user.is_verified ? (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-amber-600">
                      <XCircle className="mr-1 h-3 w-3" />
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="grid gap-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">{user.phone_number || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Joined {formatDate(user.date_joined)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {!user.is_verified && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                    onClick={handleVerify}
                    disabled={verifyMutation.isPending}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
                    {verifyMutation.isPending ? 'Verifying...' : 'Verify Identity'}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`justify-start ${
                    user.is_active 
                      ? 'border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50' 
                      : 'border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50'
                  }`}
                  onClick={handleToggleLock}
                  disabled={toggleLockMutation.isPending}
                >
                  {user.is_active ? (
                    <>
                      <Lock className="mr-2 h-4 w-4 text-red-500" />
                      {toggleLockMutation.isPending ? 'Suspending...' : 'Suspend'}
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-2 h-4 w-4 text-emerald-500" />
                      {toggleLockMutation.isPending ? 'Unlocking...' : 'Unlock'}
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="justify-start border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50"
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  <KeyRound className="mr-2 h-4 w-4 text-amber-500" />
                  {resetPasswordMutation.isPending ? 'Sending...' : 'Reset Password'}
                </Button>
              </div>
            </div>

            {/* Warning for suspended accounts */}
            {!user.is_active && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  This account is currently suspended. The user cannot access the platform.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>User not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
