"use client";

import { useState } from "react";
import { Search, Filter, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTransfers, useUpdateTransferStatus } from "@/features/transfers";
import { TransferRequest } from '@/features/transfers';
import { format } from "date-fns";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: transfers, isLoading } = useTransfers();
  const updateStatus = useUpdateTransferStatus();

  const handleApprove = (id: string) => {
    updateStatus.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    updateStatus.mutate({ id, status: 'rejected' });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
      cancelled: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return <Badge className={styles[status as keyof typeof styles]}>{status}</Badge>;
  };

  if (isLoading) {
    return <div>Loading transfers...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Transfers</h1>
          <p className="mt-2 text-slate-500">Manage student hostel transfer requests.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">Transfer Requests</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search transfers..."
                  className="pl-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Transfer ID</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Transfer Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers?.map((transfer) => (
                  <TableRow key={transfer.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-900">{transfer.id}</TableCell>
                    <TableCell>{transfer.requesterId}</TableCell>
                    <TableCell>{transfer.hostelId}</TableCell>
                    <TableCell>
                      {format(new Date(transfer.proposedTransferDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                    <TableCell className="text-slate-600">
                      {format(new Date(transfer.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleApprove(transfer.id)}
                          disabled={transfer.status !== 'pending'}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReject(transfer.id)}
                          disabled={transfer.status !== 'pending'}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
