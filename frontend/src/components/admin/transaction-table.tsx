"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import type { Payment } from "@/types/entities.types";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface TransactionTableProps {
  transactions: Payment[];
  isLoading: boolean;
}

export function TransactionTable({ transactions, isLoading }: TransactionTableProps) {
  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <div className="rounded-md border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead>Transaction ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((trx) => (
            <TableRow key={trx.id} className="hover:bg-slate-50/50">
              <TableCell className="font-medium text-slate-900">{trx.id}</TableCell>
              <TableCell>{trx.user.name}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-slate-900 capitalize">{trx.type}</span>
                  <span className="text-xs text-slate-500">{trx.method}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-600">{format(new Date(trx.date), "MMM d, yyyy")}</TableCell>
              <TableCell className={cn(
                "font-medium",
                trx.amount > 0 ? "text-emerald-600" : "text-slate-900"
              )}>
                {trx.amount > 0 ? "+" : ""} KES {Math.abs(trx.amount).toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge 
                  className={cn(
                    "capitalize",
                    trx.status === "completed" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                    trx.status === "pending" && "bg-amber-100 text-amber-700 border-amber-200",
                    trx.status === "failed" && "bg-red-100 text-red-700 border-red-200"
                  )}
                >
                  {trx.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
