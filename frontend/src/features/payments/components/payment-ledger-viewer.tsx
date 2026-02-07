'use client';

import * as React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Search, Loader2, Download } from 'lucide-react';
import apiClient from '@/lib/api/client';

interface LedgerEntry {
  id: string;
  transaction_date: string;
  bed_code: string;
  student_name: string;
  transaction_type: 'credit' | 'debit';
  amount: number;
  balance: number;
  description: string;
  reference: string;
}

export function PaymentLedgerViewer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');

  const { data: ledgerEntries, isLoading } = useQuery<LedgerEntry[]>({
    queryKey: ['payment-ledger', currentSearch],
    queryFn: async () => {
      const searchParam = currentSearch ? `?search=${encodeURIComponent(currentSearch)}` : '';
      const response = await apiClient.axios.get(`/api/v1/payments/ledger/${searchParam}`);
      return response.data.data || [];
    },
  });

  const handleSearch = () => {
    setCurrentSearch(searchQuery);
  };

  const handleExport = async () => {
    const response = await apiClient.axios.get('/api/v1/payments/ledger/export/', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payment_ledger_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Payment Ledger</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search by student name, bed code, or reference"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search
          </Button>
        </div>

        {/* Ledger Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : ledgerEntries && ledgerEntries.length > 0 ? (
          <div className="rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Bed</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      {formatDate(entry.transaction_date)}
                    </TableCell>
                    <TableCell className="font-medium">{entry.bed_code}</TableCell>
                    <TableCell className="text-sm">{entry.student_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.transaction_type === 'credit' ? 'default' : 'secondary'}
                        className="uppercase text-xs"
                      >
                        {entry.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.description}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {entry.reference}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        entry.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {entry.transaction_type === 'credit' ? '+' : '-'}
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(entry.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {currentSearch ? 'No results found' : 'No ledger entries'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
