"use client";

import React from 'react';
import { 
  Activity,
  ShieldAlert,
  ShieldCheck,
  Search
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TechSupportLog } from '@/features/support';

interface ActivityLogTableProps {
  logs: TechSupportLog[];
  isLoading: boolean;
}

export function ActivityLogTable({ logs, isLoading }: ActivityLogTableProps) {
  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading logs...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>IP Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-slate-500 text-xs font-mono">
                {log.timestamp}
              </TableCell>
              <TableCell className="font-medium">{log.user}</TableCell>
              <TableCell>
                <Badge variant="outline" className={
                  log.action.includes('Flagged') ? "border-red-200 bg-red-50 text-red-700" :
                  log.action.includes('Verified') ? "border-green-200 bg-green-50 text-green-700" :
                  "border-slate-200 bg-slate-50 text-slate-700"
                }>
                  {log.action}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-slate-600 max-w-md truncate">
                {log.details}
              </TableCell>
              <TableCell className="text-xs text-slate-400 font-mono">
                {log.ip_address}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
