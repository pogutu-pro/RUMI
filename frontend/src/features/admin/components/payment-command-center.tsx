import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, RefreshCcw, Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

// Types
interface TransactionLog {
  id: string;
  reference: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'processing';
  mpesa_receipt?: string;
  customer_name: string;
  timestamp: string;
  failure_reason?: string;
  provider: 'mpesa' | 'paystack' | 'manual';
}

interface MpesaHealth {
  status: 'operational' | 'degraded' | 'outage';
  latency_ms: number;
  failure_rate_5m: number;
}

// Mock Data Service (Replace with real API)
const fetchTransactions = async (): Promise<TransactionLog[]> => {
  // Simulate API call
  return new Promise(resolve => setTimeout(() => resolve([
    { id: '1', reference: 'RUMI-INIT-B101-20240201', amount: 15000, status: 'success', mpesa_receipt: 'QDJ9J3W45H', customer_name: 'John Doe', timestamp: new Date().toISOString(), provider: 'mpesa' },
    { id: '2', reference: 'RUMI-RENT-R204-20240201', amount: 7500, status: 'processing', customer_name: 'Jane Smith', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), provider: 'mpesa' }, // 5 mins ago
    { id: '3', reference: 'RUMI-LATE-L303-20240201', amount: 500, status: 'failed', failure_reason: 'Insufficient Funds', customer_name: 'Bob Johnson', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), provider: 'mpesa' },
  ]), 1000));
};

const fetchHealth = async (): Promise<MpesaHealth> => {
   return { status: 'operational', latency_ms: 245, failure_rate_5m: 1.2 };
}

export function PaymentCommandCenter() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: fetchTransactions,
    refetchInterval: 10000 // Poll every 10s
  });

  const { data: health } = useQuery({
    queryKey: ['mpesa-health'],
    queryFn: fetchHealth,
    refetchInterval: 30000
  });

  const getStatusBadge = (status: TransactionLog['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Success</Badge>;
      case 'processing': return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse">Processing</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getHealthColor = (status?: string) => {
      if (status === 'operational') return 'text-emerald-500';
      if (status === 'degraded') return 'text-yellow-500';
      return 'text-red-500';
  }

  const filteredTransactions = transactions?.filter(t => 
    t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.mpesa_receipt?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">M-Pesa API Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${health?.status === 'operational' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                <span className={`text-2xl font-bold capitalize ${getHealthColor(health?.status)}`}>{health?.status || '--'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
                Avg Latency: {health?.latency_ms}ms
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Stuck Payments</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-500">
                        {transactions?.filter(t => t.status === 'processing' && (Date.now() - new Date(t.timestamp).getTime() > 1000 * 60 * 10)).length || 0}
                    </span>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Pending {'>'} 10 mins</p>
            </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cluster Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span>Webuye Hostel</span>
                        <span className="text-red-400 font-bold">3 Fails</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span>Kanduyi Villa</span>
                        <span className="text-emerald-400">100% OK</span>
                    </div>
                 </div>
                 <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-white/5">Top Issues by Location</p>
            </CardContent>
        </Card>
      </div>

      {/* Transaction Command Center */}
      <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Live Transaction Feed</CardTitle>
                    <CardDescription>Real-time view of all inbound payments.</CardDescription>
                </div>
                <div className="flex space-x-2">
                     <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search Ref, Receipt, Name..." 
                            className="pl-8 bg-black/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-white/5 border-white/5">
                        <TableHead className="text-muted-foreground">Time</TableHead>
                        <TableHead className="text-muted-foreground">Reference</TableHead>
                        <TableHead className="text-muted-foreground">Customer</TableHead>
                        <TableHead className="text-muted-foreground">Amount</TableHead>
                        <TableHead className="text-muted-foreground">Method</TableHead>
                        <TableHead className="text-muted-foreground">M-Pesa Code</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading feed...</TableCell>
                         </TableRow>
                    ) : filteredTransactions?.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No transactions found.</TableCell>
                        </TableRow>
                    ) : (
                        filteredTransactions?.map((tx) => (
                            <TableRow key={tx.id} className="hover:bg-white/5 border-white/5">
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className={`h-3 w-3 ${tx.status === 'processing' && 'text-orange-500 animate-pulse'}`} />
                                        {format(new Date(tx.timestamp), 'HH:mm:ss')}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                                <TableCell className="text-sm">{tx.customer_name}</TableCell>
                                <TableCell className="text-sm font-medium">KES {tx.amount.toLocaleString()}</TableCell>
                                <TableCell className="text-xs uppercase text-muted-foreground">{tx.provider}</TableCell>
                                <TableCell className="font-mono text-xs text-emerald-400">{tx.mpesa_receipt || '-'}</TableCell>
                                <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                <TableCell className="text-right">
                                    {tx.status === 'processing' && (
                                        <Button size="sm" variant="outline" className="h-7 text-xs border-orange-500/50 text-orange-500 hover:bg-orange-500/10">
                                            Resolve Stuck
                                        </Button>
                                    )}
                                    {tx.status === 'failed' && (
                                        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground">
                                            View Logs
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      {/* Resolver Dialog Placeholder */}
      <div className="hidden">
           {/* In a real implementation, clicking "Resolve Stuck" would open a dialog to query M-Pesa status or force-fail */}
      </div>
    </div>
  );
}
