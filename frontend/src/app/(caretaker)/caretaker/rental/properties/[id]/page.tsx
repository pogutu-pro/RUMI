'use client';

import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/dashboard/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProperty, useUnits } from '@/features/rental/hooks/use-rental';

export default function CaretakerPropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const propertyId = params.id;
  const { data: property, isError, refetch } = useProperty(propertyId);
  const { data: units = [], isLoading: unitsLoading } = useUnits(propertyId);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={property?.name ?? 'Property'}
        description={property ? `${property.address}, ${property.city}` : undefined}
      />

      {unitsLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : units.length === 0 ? (
        <EmptyState
          variant="add"
          title="No units yet"
          description="Units for this property haven't been added yet."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.unit_number}</TableCell>
                <TableCell>{u.unit_type.replace('_', ' ')}</TableCell>
                <TableCell>KES {u.monthly_rent}</TableCell>
                <TableCell>
                  <Badge variant={u.status === 'occupied' ? 'default' : u.status === 'vacant' ? 'secondary' : 'destructive'}>
                    {u.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
