'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProperty, useUnits, useCreateUnit } from '@/features/rental/hooks/use-rental';

const UNIT_TYPES = ['studio', 'bedsitter', '1_bedroom', '2_bedroom', '3_bedroom', '4_bedroom', 'house', 'other'];

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const propertyId = params.id;
  const { data: property } = useProperty(propertyId);
  const { data: units = [], isLoading } = useUnits(propertyId);
  const createUnit = useCreateUnit();

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ unit_number: '', unit_type: '1_bedroom', monthly_rent: '' });

  const handleCreate = async () => {
    await createUnit.mutateAsync({ ...form, property: propertyId });
    setOpen(false);
    setForm({ unit_number: '', unit_type: '1_bedroom', monthly_rent: '' });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{property?.name ?? 'Property'}</h1>
        <p className="text-sm text-muted-foreground">{property?.address}, {property?.city}</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-medium">Units</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Add unit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add unit</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="unit_number">Unit number</Label>
                <Input
                  id="unit_number"
                  placeholder="A101"
                  value={form.unit_number}
                  onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="unit_type">Type</Label>
                <select
                  id="unit_type"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.unit_type}
                  onChange={(e) => setForm({ ...form, unit_type: e.target.value })}
                >
                  {UNIT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="monthly_rent">Monthly rent (KES)</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  value={form.monthly_rent}
                  onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!form.unit_number || !form.monthly_rent || createUnit.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : units.length === 0 ? (
        <p className="text-sm text-muted-foreground">No units yet — add the first one above.</p>
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
