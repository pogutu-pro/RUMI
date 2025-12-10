"use client";

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTechSupportStore } from '@/stores/tech-support.store';
import { TransactionTable } from '@/components/tech-support/transaction-table';

export default function PaymentSupportPage() {
  const { transactions, isLoadingTransactions, fetchTransactions } = useTechSupportStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTxns = transactions.filter(txn => 
    txn.transaction_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRequestRefund = (txnId: string) => {
    setSelectedTxnId(txnId);
    setIsRefundDialogOpen(true);
  };

  const handleViewReceipt = (txnId: string) => {
    console.log("View receipt", txnId);
  };

  const submitRefundRequest = () => {
    console.log(`Requested refund for ${selectedTxnId} with reason: ${refundReason}`);
    setRefundReason("");
    setSelectedTxnId(null);
    setIsRefundDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Support</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Monitor transactions and handle disputes.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline">
             <FileText className="mr-2 h-4 w-4" />
             View Reports
           </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Search by transaction ID or user name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search transaction ID or user..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <TransactionTable 
            transactions={filteredTxns}
            isLoading={isLoadingTransactions}
            onRequestRefund={handleRequestRefund}
            onViewReceipt={handleViewReceipt}
          />
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
            <DialogDescription>
              Initiate a refund request for transaction {selectedTxnId}. This will require SuperAdmin approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Refund</Label>
              <Textarea 
                id="reason" 
                placeholder="e.g. Double charge, Service not delivered..." 
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitRefundRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
