'use client';

import { useHostels } from '@/features/hostels';
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
import { Eye, Edit, Trash } from 'lucide-react';

export function HostelTable() {
  const { data: hostels, isLoading } = useHostels();

  if (isLoading) {
    return <div>Loading hostels...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Rooms</TableHead>
          <TableHead>Price Range</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hostels?.map((hostel) => (
          <TableRow key={hostel.id}>
            <TableCell className="font-medium">{hostel.name}</TableCell>
            <TableCell>{hostel.location}</TableCell>
            <TableCell>{hostel.rooms?.length || 0} rooms</TableCell>
            <TableCell>KES {hostel.priceRange?.min.toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant="default">Active</Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
