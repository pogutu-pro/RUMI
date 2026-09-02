'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/dashboard/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProperties } from '@/features/rental/hooks/use-rental';

export default function CaretakerPropertiesPage() {
  const { data: properties = [], isLoading } = useProperties();

  return (
    <div className="space-y-4">
      <PageHeader title="Properties" description="Properties you're assigned to as caretaker." />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          variant="add"
          title="No units assigned yet"
          description="Once a landlord assigns you to a property, its units will appear here."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="truncate font-medium">{p.name}</TableCell>
                <TableCell>{p.city}</TableCell>
                <TableCell>{p.total_units}</TableCell>
                <TableCell>
                  <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/caretaker/rental/properties/${p.id}`} className="text-primary underline">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
