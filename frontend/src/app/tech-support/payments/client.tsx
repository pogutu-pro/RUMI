'use client';

import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api/client';

interface Transaction {
  id: string;
  reference: string;
  status: string;
  amount: number;
  created_at: string;
  updated_at: string;
  callback_processed: boolean;
}

interface TechSupportPaymentsClientProps {
  defaultTab?: 'lookup' | 'failed' | 'disputes';
}

export default function TechSupportPaymentsClient({ defaultTab = 'lookup' }: TechSupportPaymentsClientProps) {
  const [searchRef, setSearchRef] = useState('');
  const [currentRef, setCurrentRef] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transaction, isLoading } = useQuery<Transaction>({
    queryKey: ['transaction-lookup', currentRef],
    queryFn: async () => {
      const response = await apiClient.axios.get(`/api/v1/payments/lookup/${currentRef}/`);
      return response.data.data;
    },
    enabled: !!currentRef,
  });

  const { data: failedPayments } = useQuery({
    queryKey: ['failed-payments'],
    queryFn: async () => {
      const response = await apiClient.axios.get('/api/v1/payments/failed/24h/');
      return response.data.data || [];
    },
  });

  const { mutate: retriggerCallback, isPending: retriggering } = useMutation({
    mutationFn: async (transactionId: string) => {
      await apiClient.axios.post(`/api/v1/payments/${transactionId}/retrigger-callback/`);
    },
    onSuccess: () => {
      toast({
        title: 'Callback re-triggered',
        description: 'Processing callback now',
      });
      queryClient.invalidateQueries({ queryKey: ['transaction-lookup'] });
    },
    onError: () => {
      toast({
        title: 'Failed to re-trigger callback',
        variant: 'destructive',
      });
    },
  });

  const handleSearch = () => {
    setCurrentRef(searchRef);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Payment Support</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Technical troubleshooting tools for payments and disputes
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="lookup">Transaction Lookup</TabsTrigger>
          <TabsTrigger value="failed">Recent Failures</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value="lookup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lookup Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Transaction reference or M-Pesa receipt"
                  value={searchRef}
                  onChange={(e) => setSearchRef(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isLoading} aria-label="search-transaction">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {transaction && (
                <div className="space-y-2 text-sm border border-border/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="font-mono text-xs">{transaction.id}</span>

                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-mono text-xs">{transaction.reference}</span>

                    <span className="text-muted-foreground">Status:</span>
                    <Badge>{transaction.status}</Badge>

                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatTimestamp(transaction.created_at)}</span>

                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{formatTimestamp(transaction.updated_at)}</span>

                    <span className="text-muted-foreground">Callback Status:</span>
                    <span>
                      {transaction.callback_processed ? '✅ Processed' : '❌ Pending'}
                    </span>
                  </div>

                  {transaction.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retriggerCallback(transaction.id)}
                      disabled={retriggering}
                      className="mt-4"
                    >
                      {retriggering ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Re-triggering...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Re-trigger Callback Processing
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Failed Payments (Last 24h)</CardTitle>
            </CardHeader>
            <CardContent>
              {failedPayments && failedPayments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Failed At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">
                          {payment.reference}
                        </TableCell>
                        <TableCell>KES {payment.amount}</TableCell>
                        <TableCell className="text-sm">
                          {formatTimestamp(payment.updated_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchRef(payment.reference);
                              setCurrentRef(payment.reference);
                            }}
                          >
                            Investigate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No failed payments in last 24 hours
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-6">
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Payment Disputes</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Dispute management is currently handled via the main admin portal.
                  Integration into tech support tools is coming in the next phase.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
