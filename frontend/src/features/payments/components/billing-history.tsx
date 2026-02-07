"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosInstance as api } from "@/lib/api/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FileText, CreditCard, Clock } from "lucide-react";

interface Invoice {
  id: number;
  invoice_number: string;
  hostel_name: string;
  total_amount: number;
  status: 'issued' | 'paid' | 'overdue' | 'cancelled' | 'in_grace';
  due_date: string;
  period_start: string;
  period_end: string;
}

export function BillingHistory() {
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['subscription-invoices'],
    queryFn: async () => {
      const response = await api.get('/payments/subscriptions/invoices/');
      return response.data.results || response.data;
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  }

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'overdue': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'issued': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_grace': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="border-none bg-zinc-900/50 backdrop-blur-sm shadow-2xl overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Platform Invoices
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Your monthly subscription history based on bed-day usage.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="border-zinc-800">
            <TableRow className="hover:bg-transparent border-zinc-800">
              <TableHead className="text-zinc-500 font-medium">Invoice</TableHead>
              <TableHead className="text-zinc-500 font-medium font-medium">Period</TableHead>
              <TableHead className="text-zinc-500 font-medium font-medium font-medium">Amount</TableHead>
              <TableHead className="text-zinc-500 font-medium font-medium font-medium font-medium">Status</TableHead>
              <TableHead className="text-right text-zinc-500 font-medium font-medium font-medium font-medium font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              invoices?.map((invoice) => (
                <TableRow key={invoice.id} className="border-zinc-800/50 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium text-white">
                    {invoice.invoice_number}
                    <div className="text-xs text-zinc-500 font-normal">{invoice.hostel_name}</div>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {format(new Date(invoice.period_start), 'MMM d')} - {format(new Date(invoice.period_end), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-white font-semibold">
                    KES {invoice.total_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(invoice.status)} capitalize border px-2 py-0.5 text-[10px]`}>
                      {invoice.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.status !== 'paid' && (
                      <Button size="sm" className="bg-white text-black hover:bg-zinc-200 h-8 gap-2">
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay Now
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
  );
}
