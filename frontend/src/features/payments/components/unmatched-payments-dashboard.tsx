'use client';

import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api/client';

interface UnmatchedPayment {
  id: string;
  mpesa_receipt: string;
  phone_number: string;
  amount: number;
  timestamp: string;
  suggested_match: {
    bed_code: string;
    student_name: string;
    confidence: number;
  } | null;
  status: 'unmatched' | 'matched' | 'rejected';
}

export function UnmatchedPaymentsDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: payments, isLoading } = useQuery<UnmatchedPayment[]>({
    queryKey: ['unmatched-payments'],
    queryFn: async () => {
      const response = await apiClient.axios.get('/api/v1/payments/unmatched/');
      return response.data.data || [];
    },
  });

  const { mutate: matchPayment, isPending: matching } = useMutation({
    mutationFn: async (data: { paymentId: string; bedId: string }) => {
      await apiClient.axios.post(`/api/v1/payments/unmatched/${data.paymentId}/match/`, {
        bed_id: data.bedId,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Payment matched successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['unmatched-payments'] });
      setSelectedPayment(null);
    },
    onError: () => {
      toast({
        title: 'Failed to match payment',
        variant: 'destructive',
      });
    },
  });

  const { mutate: rejectPayment, isPending: rejecting } = useMutation({
    mutationFn: async (paymentId: string) => {
      await apiClient.axios.post(`/api/v1/payments/unmatched/${paymentId}/reject/`);
    },
    onSuccess: () => {
      toast({
        title: 'Payment rejected',
      });
      queryClient.invalidateQueries({ queryKey: ['unmatched-payments'] });
    },
    onError: () => {
      toast({
        title: 'Failed to reject payment',
        variant: 'destructive',
      });
    },
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return { variant: 'default' as const, label: 'High' };
    if (confidence >= 0.7) return { variant: 'secondary' as const, label: 'Medium' };
    return { variant: 'outline' as const, label: 'Low' };
  };

  const filteredPayments = payments?.filter(payment =>
    payment.mpesa_receipt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.phone_number.includes(searchQuery) ||
    (payment.suggested_match?.student_name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Unmatched Payments</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manual reconciliation for M-Pesa transactions
            </p>
          </div>
          <Badge variant="secondary">
            {payments?.filter((p) => p.status === 'unmatched').length || 0} pending
          </Badge>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by receipt, phone or student name..."
              className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button size="sm">Search</Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredPayments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>M-Pesa Receipt</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Suggested Match</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const confidenceBadge = payment.suggested_match
                  ? getConfidenceBadge(payment.suggested_match.confidence)
                  : null;

                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.mpesa_receipt}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.phone_number}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatTimestamp(payment.timestamp)}
                    </TableCell>
                    <TableCell>
                      {payment.suggested_match ? (
                        <div className="text-sm">
                          <div className="font-medium">{payment.suggested_match.student_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {payment.suggested_match.bed_code}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {confidenceBadge && (
                        <Badge variant={confidenceBadge.variant} className="text-xs">
                          {confidenceBadge.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {payment.suggested_match && payment.status === 'unmatched' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              matchPayment({
                                paymentId: payment.id,
                                bedId: payment.suggested_match!.bed_code,
                              })
                            }
                            disabled={matching}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Match
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectPayment(payment.id)}
                            disabled={rejecting}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {payment.status === 'matched' && (
                        <Badge variant="default">Matched</Badge>
                      )}
                      {payment.status === 'rejected' && (
                        <Badge variant="outline">Rejected</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No unmatched payments</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
