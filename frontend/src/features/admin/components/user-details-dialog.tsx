'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Home,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'landlord' | 'caretaker';
  status: 'active' | 'suspended' | 'pending';
  joinedAt: Date;
  lastActive?: Date;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
}

interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  if (!user) return null;

  const statusIcon = {
    active: <CheckCircle className="h-4 w-4" />,
    suspended: <AlertCircle className="h-4 w-4" />,
    pending: <Clock className="h-4 w-4" />,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{user.name}</span>
            <Badge
              variant={
                user.status === 'active'
                  ? 'default'
                  : user.status === 'suspended'
                  ? 'destructive'
                  : 'secondary'
              }
              className="ml-2"
            >
              {statusIcon[user.status]}
              <span className="ml-1">{user.status}</span>
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Joined</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {user.lastActive && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Active</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.lastActive).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {user.verificationStatus && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Verification Status</p>
                      <Badge
                        variant={
                          user.verificationStatus === 'verified'
                            ? 'default'
                            : user.verificationStatus === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {user.verificationStatus}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="text-center text-muted-foreground py-8">
                Activity log will be displayed here
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="text-center text-muted-foreground py-8">
                Payment history will be displayed here
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <div className="text-center text-muted-foreground py-8">
                Verification documents will be displayed here
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1">
            Send Message
          </Button>
          <Button variant="outline" className="flex-1">
            View Full Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
