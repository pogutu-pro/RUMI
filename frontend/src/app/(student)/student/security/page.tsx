'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Shield, UserPlus, Clock, AlertTriangle, CheckCircle, Calendar, ChevronRight } from 'lucide-react';
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
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-border/50 pb-8 pt-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Security & Access Control
        </h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Manage guest authorizations and review institutional security notifications.
        </p>
      </div>

      {/* Alert for pending late entries */}
      {pendingEntries.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-amber-900 dark:text-amber-100">
                  Acknowledgement Required: {pendingEntries.length} Late Entry {pendingEntries.length === 1 ? 'Report' : 'Reports'}
                </p>
                <p className="text-xs font-medium text-amber-800/80 dark:text-amber-200/80 mt-1">
                  You have pending late entry records that require your immediate review and formal acknowledgement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[500px] h-11 p-1 bg-muted/50 border border-border/50">
          <TabsTrigger value="visitor-invitations" className="gap-2 font-bold text-xs uppercase tracking-wider">
            <UserPlus className="h-4 w-4" />
            Visitor Registry
          </TabsTrigger>
          <TabsTrigger value="late-entries" className="gap-2 font-bold text-xs uppercase tracking-wider">
            <Clock className="h-4 w-4" />
            Curfew Reports
            {pendingEntries.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px] font-black">
                {pendingEntries.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visitor-invitations" className="mt-8 space-y-6">
          {/* Quick Link to Visitor Invitations */}
          <Link href="/student/security/visitor-invitations" className="block">
            <Card className="hover:bg-muted/30 transition-colors cursor-pointer border-border/50 group">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-xl bg-muted border border-border/50 flex items-center justify-center group-hover:bg-background transition-colors">
                      <UserPlus className="h-6 w-6 text-foreground opacity-70" />
                    </div>
                    <div className="space-y-0.5">
                      <CardTitle className="text-lg font-bold">Authorized Guest Invitations</CardTitle>
                      <CardDescription className="text-xs font-medium">Issue and manage secure digital invitations for your guests.</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-all" />
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Info Card */}
          <Card className="border-border/50 bg-muted/20 shadow-none">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5 opacity-70" />
                <div className="space-y-3 text-sm">
                  <p className="font-bold text-foreground">
                    Visitor Authorization Protocol
                  </p>
                  <ul className="space-y-2 text-muted-foreground font-medium text-xs leading-relaxed">
                    <li className="flex gap-2"><span>•</span> <span>Register guest identification and projected arrival window prior to visit.</span></li>
                    <li className="flex gap-2"><span>•</span> <span>Gate security will verify credentials and record check-in events.</span></li>
                    <li className="flex gap-2"><span>•</span> <span>Check-out events must be recorded upon physical departure.</span></li>
                    <li className="flex gap-2"><span>•</span> <span>All access events are logged in the institutional security registry.</span></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="late-entries" className="mt-8 space-y-6">
          {/* Info */}
          <Card className="border-border/50 bg-muted/20 shadow-none">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5 opacity-70" />
                <div className="space-y-2 text-sm">
                  <p className="font-bold text-foreground">
                    Curfew Compliance Policy
                  </p>
                  <p className="text-muted-foreground font-medium text-xs leading-relaxed">
                    Institutional access after curfew (typically 23:00) is logged by security personnel for regulatory compliance. 
                    Residents must review these logs and provide secondary verification when requested.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Late Entries List */}
          {isLoading ? (
             <div className="py-20 text-center text-sm font-medium text-muted-foreground">
               <p>Retrieving registry records...</p>
             </div>
          ) : lateEntries.length === 0 ? (
            <Card className="border border-dashed border-border/50 bg-muted/5 shadow-none py-16">
              <CardContent className="text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-muted-foreground opacity-30" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold text-lg">No Regulatory Incidents</h3>
                    <p className="text-xs font-medium text-muted-foreground max-w-xs mx-auto">
                        Your account has no recorded late entry events for the current period.
                    </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
               <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70 px-1">Verification History</h2>
              {lateEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className={cn(
                    'border-border/50 shadow-sm transition-shadow hover:shadow-md',
                    entry.status === 'pending' && 'border-amber-500/30 bg-amber-500/5'
                  )}
                >
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-[1fr,auto] items-start gap-6">
                      <div className="space-y-5">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border/20 pb-4">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              'h-10 w-10 rounded-lg flex items-center justify-center border',
                              entry.status === 'pending'
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                                : 'bg-muted border-border/50 text-muted-foreground opacity-70'
                            )}>
                              <Clock className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-bold text-foreground">
                                Curfew Log - {new Date(entry.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
                                Verified by {entry.loggedByName}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-black uppercase tracking-wider px-2.5 h-6",
                            entry.status === 'pending'
                              ? 'border-amber-500/30 text-amber-600 bg-amber-500/5'
                              : 'border-border/50 text-muted-foreground font-bold'
                          )}>
                            {entry.status === 'pending' ? 'Pending Action' : 'Logged'}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Entry Time</p>
                            <p className="font-bold text-sm">
                              {new Date(entry.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Entry Date</p>
                            <p className="font-bold text-sm">
                              {new Date(entry.entryTime).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="space-y-1 bg-muted/30 p-4 rounded-lg border border-border/50">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Official Reason</p>
                          <p className="text-sm font-medium leading-relaxed">{entry.reason}</p>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex flex-col gap-3 min-w-[160px]">
                        {entry.status === 'pending' ? (
                            <Button
                                onClick={() => handleAcknowledge(entry.id)}
                                size="sm"
                                disabled={acknowledgeMutation.isPending}
                                className="font-bold h-10 w-full"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {acknowledgeMutation.isPending ? 'Processing...' : 'Acknowledge'}
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" className="font-bold h-10 w-full border-border/50 pointer-events-none" disabled>
                                Verified Record
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="font-bold text-xs h-9">
                            Request Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
