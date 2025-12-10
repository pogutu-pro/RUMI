"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  XCircle,
  MoreVertical,
  MessageSquare,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data
const MOCK_DISPUTES = [
  { id: 'DSP-892', type: 'refund', user: 'Alice Wonder', amount: 5000, reason: 'Double charged', status: 'open', date: '2023-12-01' },
  { id: 'DSP-893', type: 'dispute', user: 'Bob Builder', amount: 0, reason: 'Landlord not responding', status: 'investigating', date: '2023-12-02' },
  { id: 'DSP-894', type: 'refund', user: 'Charlie Day', amount: 15000, reason: 'Booking cancelled by host', status: 'resolved', date: '2023-11-28' },
];

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 capitalize">Open</Badge>;
      case "investigating":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 capitalize">Investigating</Badge>;
      case "resolved":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 capitalize">Resolved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 capitalize">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Disputes & Refunds</h1>
          <p className="mt-1 text-muted-foreground">Resolve financial issues and transaction disputes.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 shadow-sm bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground text-blue-600/80">Needs attention</p>
            </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Refund Requests</CardTitle>
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">24h</div>
                <p className="text-xs text-muted-foreground text-emerald-600">Within SLA</p>
            </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                 <CardTitle className="text-lg font-semibold">Active Cases</CardTitle>
                 <CardDescription>Manage ongoing disputes and refund claims</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search case ID..."
                  className="pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Case ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_DISPUTES.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                              {item.type === 'refund' ? <RotateCcw className="w-3 h-3 text-muted-foreground" /> : <ShieldAlert className="w-3 h-3 text-destructive" />}
                              <span className="capitalize">{item.type}</span>
                          </div>
                      </TableCell>
                      <TableCell>{item.user}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.reason}>{item.reason}</TableCell>
                      <TableCell>{item.amount > 0 ? `KES ${item.amount.toLocaleString()}` : 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                View Messages
                            </DropdownMenuItem>
                            <DropdownMenuItem>View Transaction</DropdownMenuItem>
                            <DropdownMenuItem className="text-emerald-600 dark:text-emerald-400">Resolve Case</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
