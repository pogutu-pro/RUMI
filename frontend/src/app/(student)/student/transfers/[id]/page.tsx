'use client';

import * as React from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Ban,
} from 'lucide-react';
import {
  TransferStatusBadge,
  TransferTimeline,
  PriceDifferenceIndicator,
} from '@/features/transfers';
import { getMyTransfers, cancelTransferRequest } from '@/features/transfers';
import { TransferRequest } from '@/types/entities.types';
import { TRANSFER_REASONS } from '@/lib/constants/transfer-rules';

export default function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [transfer, setTransfer] = React.useState<TransferRequest | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCancelling, setIsCancelling] = React.useState(false);

  React.useEffect(() => {
    const fetchTransfer = async () => {
      setIsLoading(true);
      try {
        const transfers = await getMyTransfers('default-hostel');
        const found = transfers.find((t) => t.id === id);
        setTransfer(found || null);
      } catch (error) {
        console.error('Error fetching transfer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransfer();
  }, [id]);

  const handleCancel = async () => {
    if (!transfer || !confirm('Are you sure you want to cancel this transfer request?')) {
      return;
    }

    setIsCancelling(true);
    try {
      await cancelTransferRequest('default-hostel', transfer.id);
      router.push('/student/transfers');
    } catch (error) {
      console.error('Error cancelling transfer:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading transfer details...</p>
        </div>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Transfer Not Found
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              The transfer request you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push('/student/transfers')}>
              Back to Transfers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reasonInfo = TRANSFER_REASONS[transfer.reason];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Transfer Request Details
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Request ID: {transfer.id}
            </p>
          </div>
          <TransferStatusBadge status={transfer.status as any} size="lg" />
        </div>
      </div>

      {/* Timeline */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Request Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <TransferTimeline
            status={transfer.status as any}
            createdAt={transfer.createdAt}
            respondedAt={transfer.respondedAt}
            completedAt={transfer.completedAt}
          />
        </CardContent>
      </Card>

      {/* Room Comparison */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Room Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Current Room</span>
              </div>
              <div className="p-4 rounded-lg border bg-muted">
                <h3 className="text-2xl font-bold text-foreground">
                  Room {transfer.oldRoom?.roomNumber || 'N/A'}
                </h3>
                {transfer.oldRoom && (
                  <p className="text-lg text-muted-foreground mt-2">
                    KES {transfer.oldRoom.price.toLocaleString()}/month
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Requested Room</span>
              </div>
              <div className="p-4 rounded-lg border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <h3 className="text-2xl font-bold text-foreground">
                  Room {transfer.newRoom?.roomNumber || 'N/A'}
                </h3>
                {transfer.newRoom && (
                  <p className="text-lg text-muted-foreground mt-2">
                    KES {transfer.newRoom.price.toLocaleString()}/month
                  </p>
                )}
              </div>
            </div>
          </div>

          {transfer.oldRoom && transfer.newRoom && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Price Adjustment
              </h4>
              <PriceDifferenceIndicator
                oldPrice={transfer.oldRoom.price}
                newPrice={transfer.newRoom.price}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Details */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Transfer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reason */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Reason for Transfer
            </Label>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl">{reasonInfo?.icon}</span>
              <span className="font-semibold text-foreground">
                {reasonInfo?.label}
              </span>
            </div>
            {transfer.reasonDetails && (
              <p className="text-sm text-muted-foreground mt-2 p-3 rounded-lg bg-muted">
                {transfer.reasonDetails}
              </p>
            )}
          </div>

          {/* Transfer Date */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Proposed Transfer Date
            </Label>
            <div className="mt-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {new Date(transfer.proposedTransferDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Submitted Date */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Submitted On
            </Label>
            <div className="mt-2 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {new Date(transfer.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Admin Notes */}
          {transfer.adminNotes && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Admin Response
              </Label>
              <div className="mt-2 p-4 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <p className="text-sm text-foreground">{transfer.adminNotes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {transfer.status === 'pending' && (
        <Card className="bg-card border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Cancel This Request
                </h4>
                <p className="text-sm text-muted-foreground">
                  You can cancel this transfer request if you no longer wish to
                  proceed.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-red-600 border-r-transparent dark:border-red-400" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Cancel Request
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
