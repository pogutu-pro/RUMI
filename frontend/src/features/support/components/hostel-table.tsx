"use client";

import React from 'react';
import { 
  MoreHorizontal, 
  MapPin,
  AlertTriangle,
  Eye,
  CheckCircle2,
  EyeOff,
  Flag
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
import { TechSupportHostel } from '@/features/support';

interface HostelTableProps {
  hostels: TechSupportHostel[];
  isLoading: boolean;
  onVerify: (hostelId: string) => void;
  onToggleVisibility: (hostelId: string) => void;
  onFlag: (hostelId: string) => void;
  onViewDetails: (hostelId: string) => void;
}

export function HostelTable({ hostels, isLoading, onVerify, onToggleVisibility, onFlag, onViewDetails }: HostelTableProps) {
  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading hostels...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hostel Name</TableHead>
            <TableHead>Landlord</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Rooms</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hostels.map((hostel) => (
            <TableRow key={hostel.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {hostel.name}
                    {hostel.status === 'flagged' && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-slate-600">{hostel.landlord_name}</TableCell>
              <TableCell>
                <div className="flex items-center text-slate-500 text-sm">
                  <MapPin className="mr-1 h-3.5 w-3.5" />
                  {hostel.location}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={
                  hostel.status === 'active' ? "bg-green-100 text-green-700 hover:bg-green-100" :
                  hostel.status === 'pending' ? "bg-orange-100 text-orange-700 hover:bg-orange-100" :
                  hostel.status === 'flagged' ? "bg-red-100 text-red-700 hover:bg-red-100" :
                  "bg-slate-100 text-slate-700 hover:bg-slate-100"
                }>
                  {hostel.status}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-600">{hostel.rooms_count}</TableCell>
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
                    <DropdownMenuItem onClick={() => onViewDetails(hostel.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details & Docs
                    </DropdownMenuItem>
                    {!hostel.is_verified && (
                      <DropdownMenuItem onClick={() => onVerify(hostel.id)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Verify Listing
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onToggleVisibility(hostel.id)}>
                      <EyeOff className="mr-2 h-4 w-4" />
                      {hostel.status === 'hidden' ? 'Unhide Listing' : 'Hide / Unlist'}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => onFlag(hostel.id)}>
                      <Flag className="mr-2 h-4 w-4" />
                      Flag for Investigation
                    </DropdownMenuItem>
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
