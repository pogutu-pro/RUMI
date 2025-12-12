"use client";

import React from 'react';
import { 
  MoreHorizontal, 
  FileText,
  RotateCcw
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TechSupportTransaction } from '@/features/support';

interface TransactionTableProps {
  transactions: TechSupportTransaction[];
  isLoading: boolean;
  onRequestRefund: (txnId: string) => void;
  onViewReceipt: (txnId: string) => void;
}

export function TransactionTable({ transactions, isLoading, onRequestRefund, onViewReceipt }: TransactionTableProps) {
  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading transactions...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((txn) => (
            <TableRow key={txn.id}>
              <TableCell className="font-mono text-xs">{txn.transaction_reference}</TableCell>
              <TableCell className="font-medium">{txn.student_name}</TableCell>
              <TableCell>{txn.type}</TableCell>
              <TableCell>KES {txn.amount.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={
                  txn.status === 'success' ? "bg-green-100 text-green-700 hover:bg-green-100" :
                  txn.status === 'failed' ? "bg-red-100 text-red-700 hover:bg-red-100" :
                  txn.status === 'refunded' ? "bg-purple-100 text-purple-700 hover:bg-purple-100" :
                  "bg-slate-100 text-slate-700 hover:bg-slate-100"
                }>
                  {txn.status}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-500 text-xs">{txn.date}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewReceipt(txn.id)}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Receipt
                    </DropdownMenuItem>
                    {txn.status === 'success' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onRequestRefund(txn.id)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Request Refund
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
