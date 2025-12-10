'use client';

import * as React from 'react';
import { useRoommateRequests, useRespondToRoommateRequest } from '@/hooks/use-roommates';
import { RequestStatusCard } from '@/components/roommates/request-status-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card,CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Inbox } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RequestsPage() {
  const { data: requests, isLoading } = useRoommateRequests();
  const respondMutation = useRespondToRoommateRequest();
  const router = useRouter();

  const sentRequests = React.useMemo(() => {
    return requests?.filter((r: any) => r.type === 'sent') || [];
  }, [requests]);

  const receivedRequests = React.useMemo(() => {
    return requests?.filter((r: any) => r.type === 'received') || [];
  }, [requests]);

  const pendingApprovalRequests = React.useMemo(() => {
    return requests?.filter(
      (r: any) => r.roommateApprovalStatus === 'approved' && r.caretakerApprovalStatus === 'pending'
    ) || [];
  }, [requests]);

  const handleAccept = async (requestId: string) => {
    try {
      await respondMutation.mutateAsync({ requestId, accept: true });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await respondMutation.mutateAsync({ requestId, accept: false });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleMessage = (userId: string) => {
    router.push(`/student/messages?user=${userId}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roommate Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage your sent and received roommate requests
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/student/roommates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roommates
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="received" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="received" className="relative">
            Received
            {receivedRequests.filter((r: any) => r.roommateApprovalStatus === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {receivedRequests.filter((r: any) => r.roommateApprovalStatus === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingApprovalRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">
                {pendingApprovalRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Received Requests */}
        <TabsContent value="received" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : receivedRequests.length > 0 ? (
            <div className="space-y-4">
              {receivedRequests.map((request: any) => (
                <RequestStatusCard
                  key={request.id}
                  request={request}
                  type="received"
                  onAccept={() => handleAccept(request.id)}
                  onReject={() => handleReject(request.id)}
                  onMessage={() => handleMessage(request.otherUser.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No received requests yet" />
          )}
        </TabsContent>

        {/* Sent Requests */}
        <TabsContent value="sent" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sentRequests.length > 0 ? (
            <div className="space-y-4">
              {sentRequests.map((request: any) => (
                <RequestStatusCard
                  key={request.id}
                  request={request}
                  type="sent"
                  onWithdraw={() => handleReject(request.id)}
                  onMessage={() => handleMessage(request.otherUser.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              message="No sent requests yet"
              action={
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link href="/student/roommates/matches">Find Matches</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        {/* Pending Approval */}
        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingApprovalRequests.length > 0 ? (
            <>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg text-sm">
                <p className="text-muted-foreground">
                  These requests have been accepted by both roommates and are awaiting final approval from the caretaker or landlord.
                </p>
              </div>
              <div className="space-y-4">
                {pendingApprovalRequests.map((request: any) => (
                  <RequestStatusCard
                    key={request.id}
                    request={request}
                    type={request.type}
                    onMessage={() => handleMessage(request.otherUser.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <EmptyState message="No requests pending approval" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{message}</h3>
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
