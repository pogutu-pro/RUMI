'use client';

import React from 'react';
import { useRentPeriods } from '../hooks/use-payments';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PriceDisplay } from '@/components/ui/price-display';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CalendarOff, 
  ArrowRightLeft,
  Info,
  Building,
  Bed,
  CreditCard,
  ChevronDown,
  History
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const RentHistoryTimeline = () => {
  const { data: rentPeriods, isLoading } = useRentPeriods();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!rentPeriods || rentPeriods.length === 0) {
    return (
      <Card className="border border-dashed border-border bg-muted/5 rounded-lg">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-lg bg-muted p-4 border border-border">
            <CalendarOff className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <CardTitle className="text-xl font-black uppercase tracking-tight">No History Found</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest mt-1">
            No rent records exist for this account yet.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const sortedPeriods = [...rentPeriods].sort((a, b) => 
    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  return (
    <Card className="border border-border bg-card shadow-none rounded-lg overflow-hidden">
      <CardHeader className="py-4 border-b border-border bg-muted/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground border border-border">
              <History className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Payment History</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-tighter">
                Chronological record of all rent cycles and spatial allocations.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground opacity-70">Cycles:</span>
              <Badge variant="outline" className="h-5 px-2 text-[9px] font-black border-border shadow-none">{sortedPeriods.length}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground py-3 h-auto">Cycle</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground py-3 h-auto">Hostel</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground py-3 h-auto">Space ID</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground py-3 h-auto text-right">Target</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground py-3 h-auto text-right">Paid</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground py-3 h-auto text-center">Status</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-muted-foreground py-3 h-auto text-center">Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPeriods.map((period) => (
              <TableRow key={period.id} className="border-border hover:bg-muted/5 transition-colors">
                <TableCell className="py-4 px-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase text-foreground leading-none">
                      {new Date(period.start_date).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground opacity-70 uppercase tracking-tighter mt-1 leading-none">
                      {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3 text-muted-foreground opacity-50" />
                    <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80 leading-none">
                      {period.hostel_details?.name || '---'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <Bed className="h-3 w-3 text-muted-foreground opacity-50" />
                    <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80 leading-none">
                      {period.room_details?.room_number || '---'} <span className="opacity-30">/</span> Bed {(period as any).bed_id || '01'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-right">
                  <PriceDisplay amount={period.amount_due} size="sm" className="font-bold text-foreground opacity-80" />
                </TableCell>
                <TableCell className="py-4 text-right">
                  <PriceDisplay amount={period.amount_paid} size="sm" className="font-black text-emerald-600" />
                </TableCell>
                <TableCell className="py-4 text-center">
                  <StatusBadge status={period.status} className="text-[8px] px-2 py-0.5 uppercase font-black tracking-widest" />
                </TableCell>
                <TableCell className="py-4 text-center">
                   <div className="flex justify-center items-center gap-1">
                      {period.status === 'transferred' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="h-5 px-1 bg-blue-500/5 text-blue-600 border-blue-500/20 rounded shadow-none">
                                <ArrowRightLeft className="h-3 w-3" />
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="bg-card border border-border shadow-none p-3 rounded-lg">
                              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-blue-600 leading-none">Spatial Transfer</p>
                              <p className="text-[10px] font-bold text-muted-foreground leading-tight">This cycle started in a different room or bed.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {period.transactions && period.transactions.length > 0 && (
                        <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger>
                               <Badge variant="outline" className="h-5 px-1 bg-primary/5 text-primary border-primary/20 rounded shadow-none">
                                 <CreditCard className="h-3 w-3" />
                               </Badge>
                             </TooltipTrigger>
                             <TooltipContent className="bg-card border border-border shadow-none p-0 rounded-lg overflow-hidden w-64">
                                <div className="bg-muted/10 p-2 border-b border-border">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary leading-none">Records</p>
                                </div>
                                <div className="p-2 space-y-2">
                                    {period.transactions.map(txn => (
                                        <div key={txn.id} className="flex items-center justify-between text-[9px] font-bold">
                                            <span className="font-mono opacity-60">{txn.reference}</span>
                                            <PriceDisplay amount={txn.amount} size="sm" className="font-black" />
                                        </div>
                                    ))}
                                </div>
                             </TooltipContent>
                           </Tooltip>
                        </TooltipProvider>
                      )}
                   </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
