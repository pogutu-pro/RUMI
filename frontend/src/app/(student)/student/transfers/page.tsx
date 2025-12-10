'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRightLeft,
  Plus,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { DashboardStatCard } from '@/components/student/dashboard-stat-card';
import {
  TransferStatusBadge,
  TransferTimeline,
  PriceDifferenceIndicator,
  TransferSkeleton,
  EmptyState,
  TransferAlert,
} from '@/components/transfers';
import { useTransferStore } from '@/stores/transfer.store';
import { getMyTransfers } from '@/lib/api/transfers';

export default function TransfersPage() {
  const router = useRouter();
  const { myTransfers, activeRequest, transferHistory, setMyTransfers, isLoading, setLoading } =
    useTransferStore();

  // Fetch transfers on mount
  React.useEffect(() => {
    const fetchTransfers = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual hostel ID from user context
        const transfers = await getMyTransfers('default-hostel');
        setMyTransfers(transfers);
      } catch (error) {
        console.error('Error fetching transfers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, [setMyTransfers, setLoading]);

  const stats = {
    activeRequests: activeRequest ? 1 : 0,
    completedTransfers: transferHistory.filter((t) => t.status === 'completed')
      .length,
    totalRequests: myTransfers.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Room Transfers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Request a room transfer or browse available rooms
          </p>
        </div>
        <Link href="/student/transfers/create">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={activeRequest?.status === 'pending'}
          >
            <Plus className="h-4 w-4 mr-2" />
            {activeRequest?.status === 'pending'
              ? 'Request Pending'
              : 'New Transfer'}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          title="Active Request"
          value={stats.activeRequests}
          subtitle={
            activeRequest
              ? `Status: ${activeRequest.status}`
              : 'No active requests'
          }
          icon={<Clock className="h-4 w-4" />}
          variant={activeRequest ? 'blue' : 'default'}
        />
        <DashboardStatCard
          title="Completed Transfers"
          value={stats.completedTransfers}
          subtitle="Successfully transferred"
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="emerald"
        />
        <DashboardStatCard
          title="Total Requests"
          value={stats.totalRequests}
          subtitle="All time"
          icon={<TrendingUp className="h-4 w-4" />}
          variant="default"
        />
      </section>

      {/* Active Request Alert */}
      {activeRequest && activeRequest.status === 'pending' && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Transfer Request Pending
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                You have an active transfer request from Room{' '}
                {activeRequest.oldRoom?.roomNumber} to Room{' '}
                {activeRequest.newRoom?.roomNumber}. You'll be notified once
                it's reviewed.
              </p>
            </div>
            <Link href={`/student/transfers/${activeRequest.id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="my-transfers" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-transfers">My Transfers</TabsTrigger>
          <TabsTrigger value="available">Available Rooms</TabsTrigger>
        </TabsList>

        {/* My Transfers Tab */}
        <TabsContent value="my-transfers" className="space-y-4">
          {isLoading ? (
            <TransferSkeleton type="list" count={3} />
          ) : myTransfers.length === 0 ? (
            <EmptyState
              icon={<ArrowRightLeft className="h-10 w-10 text-muted-foreground" />}
              title="No Transfer Requests Yet"
              description="You haven't requested any room transfers. Browse available rooms and submit your first transfer request."
              action={{
                label: 'Browse Available Rooms',
                onClick: () => window.location.href = '/student/transfers/available',
                icon: <ArrowRightLeft className="h-4 w-4 mr-2" />,
              }}
            />
          ) : (
            <div className="space-y-4">
              {myTransfers.map((transfer) => (
                <Card key={transfer.id} className="bg-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Timeline */}
                      <div className="lg:w-1/3 lg:border-r lg:pr-6 dark:border-gray-700">
                        <TransferTimeline
                          status={transfer.status as any}
                          createdAt={transfer.createdAt}
                          respondedAt={transfer.respondedAt}
                          completedAt={transfer.completedAt}
                        />
                      </div>

                      {/* Details */}
                      <div className="lg:w-2/3 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              Transfer Request
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Submitted on{' '}
                              {new Date(transfer.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <TransferStatusBadge status={transfer.status as any} />
                        </div>

                        {/* Room Transfer Info */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase">
                              From
                            </p>
                            <p className="text-lg font-semibold text-foreground">
                              Room {transfer.oldRoom?.roomNumber || 'N/A'}
                            </p>
                            {transfer.oldRoom && (
                              <p className="text-sm text-muted-foreground">
                                KES {transfer.oldRoom.price.toLocaleString()}/month
                              </p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase">
                              To
                            </p>
                            <p className="text-lg font-semibold text-foreground">
                              Room {transfer.newRoom?.roomNumber || 'N/A'}
                            </p>
                            {transfer.newRoom && (
                              <p className="text-sm text-muted-foreground">
                                KES {transfer.newRoom.price.toLocaleString()}/month
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price Difference */}
                        {transfer.oldRoom && transfer.newRoom && (
                          <PriceDifferenceIndicator
                            oldPrice={transfer.oldRoom.price}
                            newPrice={transfer.newRoom.price}
                            size="sm"
                          />
                        )}

                        {/* Transfer Date */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Proposed transfer date:{' '}
                            {new Date(
                              transfer.proposedTransferDate
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Admin Notes */}
                        {transfer.adminNotes && (
                          <div className="rounded-lg bg-muted p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Admin Note:
                            </p>
                            <p className="text-sm text-foreground">
                              {transfer.adminNotes}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Link href={`/student/transfers/${transfer.id}`}>
                            <Button variant="outline">View Details</Button>
                          </Link>
                          {transfer.status === 'pending' && (
                            <Button
                              variant="outline"
                              className="text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              Cancel Request
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Available Rooms Tab */}
        <TabsContent value="available">
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Browse Available Rooms
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                View all rooms available for transfer in a dedicated browse
                interface
              </p>
              <Link href="/student/transfers/available">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Go to Available Rooms
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
