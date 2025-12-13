"use client";

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  FileText,
  AlertOctagon,
  Eye,
  CreditCard,
  ShieldAlert
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
// import { useTechSupportStore } from '@/features/support';
import { useSupportTransactions } from '@/features/support/hooks/use-support';
import { TransactionTable } from '@/features/support';

interface PaymentSupportPageProps {
  defaultTab?: string;
}

export default function PaymentSupportPage({ defaultTab = "all" }: PaymentSupportPageProps) {
  const { data: response, isLoading: isLoadingTransactions } = useSupportTransactions();
  const transactions = response?.data || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const filteredTxns = transactions.filter(txn => {
    const matchesSearch = txn.transaction_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.student_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Simulate dispute logic for demo purposes if backend doesn't have it explicitly yet
    // In a real scenario, check txn.status === 'dispute'
    if (activeTab === 'disputes') {
       return matchesSearch && (txn.status === 'failed' || txn.status === 'pending');
    }
    
    return matchesSearch;
  });

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Payment Support
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor individual transactions and resolve disputes.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="px-3 py-1 border-amber-500/50 text-amber-600 dark:text-amber-500 bg-amber-500/10">
             <Eye className="mr-2 h-3 w-3" />
             View Only Access
           </Badge>
           <Button variant="outline">
             <FileText className="mr-2 h-4 w-4" />
             Export Log
           </Button>
        </div>
      </div>

      {/* Restricted Access Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-4 flex items-start gap-3">
        <AlertOctagon className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Restricted Financial Access</h3>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
            As a Tech Support agent, you can view individual transaction statuses to assist users with failures or disputes. 
            You do not have access to total revenue, withdrawal settings, or bank account details.
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            All Transactions
          </TabsTrigger>
          <TabsTrigger value="disputes" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Disputes / Failed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
             <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    Search by transaction ID (TXN-...) or student name.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Search */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search transaction ID or user..." 
                        className="pl-9 bg-background/50 border-input/60 focus-visible:ring-primary/20"
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
        </TabsContent>
        <TabsContent value="disputes" className="space-y-4">
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Disputed & Failed Transactions</CardTitle>
                  <CardDescription>
                    Transactions requiring attention or manual intervention.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search disputes..." 
                        className="pl-9 bg-background/50 border-input/60 focus-visible:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <TransactionTable 
                    transactions={filteredTxns}
                    isLoading={isLoadingTransactions}
                    onRequestRefund={handleRequestRefund}
                    onViewReceipt={handleViewReceipt}
                  />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
            <DialogDescription>
              Initiate a refund request for transaction <span className="font-mono text-primary">{selectedTxnId}</span>. This will require SuperAdmin approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Refund</Label>
              <Textarea 
                id="reason" 
                placeholder="e.g. Double charge, Service not delivered..." 
                className="min-h-[100px]"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitRefundRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
