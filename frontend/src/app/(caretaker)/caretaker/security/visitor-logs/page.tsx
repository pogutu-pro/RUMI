'use client';

import * as React from 'react';
import { UserCheck, Search, Clock, User, CheckCircle, Home, Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface VisitorInvitation {
  id: string;
  visitorName: string;
  visitorPhone?: string;
  visitorIdNumber: string;
  studentName: string;
  studentId: string;
  roomNumber: string;
  purpose: string;
  expectedArrivalTime: string;
  status: 'pending' | 'checked_in' | 'checked_out';
  checkedInAt?: string;
  checkedInBy?: string;
  checkedOutAt?: string;
  checkedOutBy?: string;
  createdAt: string;
}

const mockInvitations: VisitorInvitation[] = [
  {
    id: '1',
    visitorName: 'Jane Kamau',
    visitorPhone: '+254712345678',
    visitorIdNumber: '34567890',
    studentName: 'John Omondi',
    studentId: 'STU2024001',
    roomNumber: '204',
    purpose: 'Family visit - Birthday celebration',
    expectedArrivalTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    visitorName: 'Peter Mwangi',
    visitorPhone: '+254723456789',
    visitorIdNumber: 'A123456',
    studentName: 'Sarah Wanjiku',
    studentId: 'STU2024003',
    roomNumber: '202',
    purpose: 'Delivery - Books and study materials',
    expectedArrivalTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'checked_in',
    checkedInAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    checkedInBy: 'Caretaker James',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    visitorName: 'Sarah Wanjiku',
    visitorIdNumber: '45678901',
    studentName: 'Grace Akinyi',
    studentId: 'STU2024004',
    roomNumber: '203',
    purpose: 'Study group session',
    expectedArrivalTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'checked_out',
    checkedInAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    checkedInBy: 'Caretaker James',
    checkedOutAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    checkedOutBy: 'Caretaker James',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    visitorName: 'Michael Njoroge',
    visitorPhone: '+254734567890',
    visitorIdNumber: 'B789012',
    studentName: 'David Kipchoge',
    studentId: 'STU2024005',
    roomNumber: '205',
    purpose: 'Family visit',
    expectedArrivalTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

export default function VisitorLogsPage() {
  const [invitations, setInvitations] = React.useState<VisitorInvitation[]>(mockInvitations);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const filteredInvitations = invitations.filter(inv =>
    searchQuery === '' ||
    inv.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.roomNumber.includes(searchQuery) ||
    inv.visitorIdNumber.includes(searchQuery)
  );

  const stats = {
    pending: invitations.filter(i => i.status === 'pending').length,
    active: invitations.filter(i => i.status === 'checked_in').length,
    todayTotal: invitations.filter(i => 
      new Date(i.createdAt).toDateString() === new Date().toDateString()
    ).length,
  };

  const handleCheckIn = async (invitation: VisitorInvitation) => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setInvitations(prev => prev.map(inv =>
      inv.id === invitation.id
        ? {
            ...inv,
            status: 'checked_in' as const,
            checkedInAt: new Date().toISOString(),
            checkedInBy: 'Caretaker James', // From auth context
          }
        : inv
    ));
    
    setIsLoading(false);
    
    toast.success('Visitor checked in', {
      description: `${invitation.visitorName} checked in at ${new Date().toLocaleTimeString()}`,
    });
  };

  const handleCheckOut = async (invitation: VisitorInvitation) => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setInvitations(prev => prev.map(inv =>
      inv.id === invitation.id
        ? {
            ...inv,
            status: 'checked_out' as const,
            checkedOutAt: new Date().toISOString(),
            checkedOutBy: 'Caretaker James',
          }
        : inv
    ));
    
    setIsLoading(false);
    
    toast.success('Visitor checked out', {
      description: `${invitation.visitorName} checked out at ${new Date().toLocaleTimeString()}`,
    });
  };

  const getStatusBadge = (status: VisitorInvitation['status']) => {
    const variants = {
      pending: { label: 'Waiting Arrival', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' },
      checked_in: { label: 'In Hostel', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      checked_out: { label: 'Departed', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    };
    
    return <Badge className={variants[status].className}>{variants[status].label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Visitor Logs
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Manage student visitor check-ins and check-outs for security
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Arrivals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Expected visitors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Currently In Hostel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Active visitors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayTotal}</div>
            <p className="text-xs text-muted-foreground mt-1">All invitations today</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                How Visitor Management Works
              </p>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                <li>• Students invite visitors through their dashboard</li>
                <li>• You see all pending visitor invitations here</li>
                <li>• Click "Check In" when visitor arrives - time is recorded automatically</li>
                <li>• Click "Check Out" when visitor leaves - time is recorded automatically</li>
                <li>• All visitor activity is logged for security purposes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by visitor name, student, room number, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visitor Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Visitor Invitations</CardTitle>
          <CardDescription>Student-invited visitors requiring check-in/check-out</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor Details</TableHead>
                  <TableHead>Visiting Student</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead>Check-Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No visitor invitations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invitation.visitorName}</p>
                          <p className="text-xs text-muted-foreground">ID: {invitation.visitorIdNumber}</p>
                          {invitation.visitorPhone && (
                            <p className="text-xs text-muted-foreground">{invitation.visitorPhone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invitation.studentName}</p>
                          <p className="text-xs text-muted-foreground">{invitation.studentId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          Room {invitation.roomNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">{invitation.purpose}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {new Date(invitation.expectedArrivalTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {invitation.checkedInAt ? (
                          <div>
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              {new Date(invitation.checkedInAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {invitation.checkedInBy && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                by {invitation.checkedInBy}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {invitation.checkedOutAt ? (
                          <div>
                            <div className="flex items-center gap-1">
                              {new Date(invitation.checkedOutAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {invitation.checkedOutBy && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                by {invitation.checkedOutBy}
                              </p>
                            )}
                          </div>
                        ) : invitation.checkedInAt ? (
                          <span className="text-muted-foreground">Still visiting</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invitation.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invitation.status === 'pending' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleCheckIn(invitation)}
                              disabled={isLoading}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Check In
                            </Button>
                          )}
                          {invitation.status === 'checked_in' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(invitation)}
                              disabled={isLoading}
                            >
                              Check Out
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
