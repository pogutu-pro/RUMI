'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Shield, UserPlus, Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils/cn';

import { useMyLateEntries, useAcknowledgeLateEntry } from '@/features/student';

export default function StudentSecurityPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'late-entries' ? 'late-entries' : 'visitor-invitations';
  
  const { data: lateEntries = [], isLoading } = useMyLateEntries();
  const acknowledgeMutation = useAcknowledgeLateEntry();
  const [selectedTab, setSelectedTab] = React.useState(initialTab);
  
  // Update state if search param changes
  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'late-entries') {
      setSelectedTab('late-entries');
    } else if (tab === 'visitor-invitations') {
      setSelectedTab('visitor-invitations');
    }
  }, [searchParams]);

  const pendingEntries = lateEntries.filter(e => e.status === 'pending');
  const acknowledgedEntries = lateEntries.filter(e => e.status === 'acknowledged');

  const handleAcknowledge = (id: string) => {
    acknowledgeMutation.mutate(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Security & Visitors
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Manage visitor invitations and view security notifications
        </p>
      </div>

      {/* Alert for pending late entries */}
      {pendingEntries.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  {pendingEntries.length} Late Entry {pendingEntries.length === 1 ? 'Report' : 'Reports'} Pending Acknowledgement
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Please review and acknowledge your late entry reports below
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visitor-invitations" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Visitor Invitations
          </TabsTrigger>
          <TabsTrigger value="late-entries" className="gap-2">
            <Clock className="h-4 w-4" />
            Late Entry Reports
            {pendingEntries.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                {pendingEntries.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visitor-invitations" className="mt-6 space-y-4">
          {/* Quick Link to Visitor Invitations */}
          <Link href="/student/security/visitor-invitations">
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Manage Visitor Invitations</CardTitle>
                      <CardDescription>Invite guests and track their check-in status</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View All →
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Info Card */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Visitor Invitation Process
                  </p>
                  <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                    <li>• Fill in visitor details including ID number and expected arrival time</li>
                    <li>• Caretaker will check them in when they arrive at the gate</li>
                    <li>• Caretaker will check them out when they leave</li>
                    <li>• All visitor activity is logged for security purposes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="late-entries" className="mt-6 space-y-4">
          {/* Info */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    About Late Entry Reports
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">
                    Caretakers log late-night entries (after curfew) for security purposes. 
                    You can view these reports and provide explanations if needed. 
                    Hostel curfew is typically 11:00 PM unless otherwise specified.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Late Entries List */}
          {isLoading ? (
             <div className="p-8 text-center text-sm text-muted-foreground">
               <span className="loading loading-spinner loading-lg"></span>
               <p>Loading reports...</p>
             </div>
          ) : lateEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600 dark:text-green-400 mb-4" />
                <h3 className="font-semibold mb-2">No Late Entry Reports</h3>
                <p className="text-sm text-muted-foreground">
                  You have no late entry reports. Keep up the good work!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {lateEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className={cn(
                    'transition-all',
                    entry.status === 'pending' && 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'h-10 w-10 rounded-full flex items-center justify-center',
                              entry.status === 'pending'
                                ? 'bg-amber-100 dark:bg-amber-900/20'
                                : 'bg-green-100 dark:bg-green-900/20'
                            )}>
                              <Clock className={cn(
                                'h-5 w-5',
                                entry.status === 'pending'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-green-600 dark:text-green-400'
                              )} />
                            </div>
                            <div>
                              <p className="font-semibold">
                                Late Entry - {new Date(entry.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Reported by {entry.loggedByName}
                              </p>
                            </div>
                          </div>
                          <Badge className={cn(
                            entry.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          )}>
                            {entry.status === 'pending' ? 'Pending' : 'Acknowledged'}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Entry Time</p>
                            <p className="font-semibold">
                              {new Date(entry.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Date</p>
                            <p className="font-semibold">
                              {new Date(entry.entryTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Reason */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Reason Provided</p>
                          <p className="text-sm">{entry.reason}</p>
                        </div>

                        {/* Notes */}
                        {entry.notes && (
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Notes</p>
                            <p className="text-sm text-blue-900 dark:text-blue-100">{entry.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      {entry.status === 'pending' && (
                        <Button
                          onClick={() => handleAcknowledge(entry.id)}
                          size="sm"
                          disabled={acknowledgeMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {acknowledgeMutation.isPending ? 'Saving...' : 'Acknowledge'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Late Entry Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">Total Reports</p>
                  <p className="text-2xl font-bold">{lateEntries.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">This Month</p>
                  <p className="text-2xl font-bold">
                    {lateEntries.filter(e => {
                      const entryDate = new Date(e.entryTime);
                      const now = new Date();
                      return entryDate.getMonth() === now.getMonth() &&
                             entryDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
