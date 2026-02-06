import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Hostel } from '@/types/entities.types';

interface HostelComparisonTableProps {
  hostels: Hostel[];
}

export function HostelComparisonTable({
  hostels,
}: HostelComparisonTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hostel</TableHead>
          <TableHead>Price/month</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Distance to Campus</TableHead>
          <TableHead>Amenities</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hostels.map((hostel) => (
          <TableRow key={hostel.id}>
            <TableCell className="font-medium">{hostel.name}</TableCell>
            <TableCell>KSh {Number(hostel.base_price ?? 0).toLocaleString()}</TableCell>
            <TableCell>{parseFloat(hostel.rating || '0').toFixed(1)}</TableCell>
            <TableCell>{hostel.distance_from_university ?? 'Near'} km</TableCell>
            <TableCell>{(hostel.amenities_list || []).join(', ')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
