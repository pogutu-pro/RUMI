'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { Eye, FileText, Download } from 'lucide-react';
import { useSubscriptionAccrual } from '@/features/payments/hooks/use-subscription-accrual';
import { StatusPill } from '@/components/ui/status-pill';
import { format } from 'date-fns';

export function InteractiveInvoice() {
  const { data: accrual, isLoading } = useSubscriptionAccrual();

  if (isLoading) {
      return <div className="p-8 text-center text-muted-foreground">Loading invoice details...</div>;
  }

  if (!accrual) return null;

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Current Invoice Breakdown</CardTitle>
                <CardDescription>Real-time billing based on occupancy</CardDescription>
            </div>
             <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">Hostel / Item</TableHead>
              <TableHead>Occupied Bed-Days</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accrual.hostel_breakdown.map((hostel) => (
              <TableRow key={hostel.hostel__name} className="group">
                <TableCell className="font-medium">
                    <div className="flex flex-col">
                        <span>{hostel.hostel__name}</span>
                        <span className="text-xs text-muted-foreground">{hostel.bed_days} occupied beds</span>
                    </div>
                </TableCell>
                <TableCell>{hostel.bed_days}</TableCell>
                <TableCell>KES 50 / day</TableCell>
                <TableCell className="text-right font-bold">
                    KES {(hostel.bed_days * 50).toLocaleString()}
                </TableCell>
                <TableCell>
                    <Dialog>
                        <DialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                             <DialogHeader>
                                <DialogTitle>Detailed Bed Log - {hostel.hostel__name}</DialogTitle>
                                <DialogDescription>
                                    Daily occupancy records for this billing period.
                                </DialogDescription>
                             </DialogHeader>
                             <div className="max-h-[60vh] overflow-y-auto border rounded-md">
                                 <Table>
                                     <TableHeader>
                                         <TableRow>
                                             <TableHead>Date</TableHead>
                                             <TableHead>Room</TableHead>
                                             <TableHead>Status</TableHead>
                                         </TableRow>
                                     </TableHeader>
                                     <TableBody>
                                         <TableRow>
                                             <TableCell>2024-02-01</TableCell>
                                             <TableCell>Room 101</TableCell>
                                             <TableCell><StatusPill status="success">Occupied</StatusPill></TableCell>
                                         </TableRow>
                                          {/* Mock Data - real implementation would fetch logs */}
                                          <TableRow>
                                             <TableCell>2024-02-01</TableCell>
                                             <TableCell>Room 102</TableCell>
                                             <TableCell><StatusPill status="success">Occupied</StatusPill></TableCell>
                                         </TableRow>
                                     </TableBody>
                                 </Table>
                             </div>
                        </DialogContent>
                    </Dialog>
                </TableCell>
              </TableRow>
            ))}
            
            {/* Summary Row */}
            <TableRow className="bg-muted/50 font-bold border-t-2">
                <TableCell>Total Due</TableCell>
                <TableCell>{accrual.total_occupied_bed_days}</TableCell>
                <TableCell>-</TableCell>
                <TableCell className="text-right text-lg">
                    KES {accrual.projected_accrual.toLocaleString()}
                </TableCell>
                <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
