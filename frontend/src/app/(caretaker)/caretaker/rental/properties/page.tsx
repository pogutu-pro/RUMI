'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProperties } from '@/features/rental/hooks/use-rental';

export default function CaretakerPropertiesPage() {
  const { data: properties = [], isLoading } = useProperties();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Properties</h1>
      <p className="text-sm text-muted-foreground">Properties you're assigned to as caretaker.</p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">No properties assigned to you yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.city}</TableCell>
                <TableCell>{p.total_units}</TableCell>
                <TableCell>
                  <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
