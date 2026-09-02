'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProperty, useUnits, useCreateUnit } from '@/features/rental/hooks/use-rental';
import { GateBanner } from '@/features/rental/components/gate-banner';
import { isGateRejection } from '@/lib/api/gate';
import { PageHeader } from '@/components/dashboard/page-header';

const UNIT_TYPES = ['studio', 'bedsitter', '1_bedroom', '2_bedroom', '3_bedroom', '4_bedroom', 'house', 'other'] as const;

const unitSchema = z.object({
  unit_number: z.string().trim().min(1, 'Unit number is required').max(50),
  unit_type: z.enum(UNIT_TYPES),
  monthly_rent: z.coerce.number().positive('Monthly rent must be greater than 0'),
});

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const propertyId = params.id;
  const { data: property } = useProperty(propertyId);
  const { data: units = [], isLoading } = useUnits(propertyId);
  const createUnit = useCreateUnit();

  const [open, setOpen] = React.useState(false);
  const gateError = isGateRejection(createUnit.error);

  const form = useForm<z.input<typeof unitSchema>, unknown, z.output<typeof unitSchema>>({
    resolver: zodResolver(unitSchema),
    defaultValues: { unit_number: '', unit_type: '1_bedroom', monthly_rent: 0 },
  });

  const handleCreate = form.handleSubmit(async (values) => {
    try {
      await createUnit.mutateAsync({ ...values, property: propertyId });
      setOpen(false);
      form.reset();
    } catch {
      // handled via createUnit.error / isGateRejection in render
    }
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{property?.name ?? 'Property'}</h1>
        <p className="text-sm text-muted-foreground">{property?.address}, {property?.city}</p>
      </div>

      <PageHeader
        title="Units"
        action={(
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>Add unit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add unit</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={handleCreate} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="unit_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="A101" className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNIT_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthly_rent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly rent (KES)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" className="h-11" value={field.value as number} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {gateError && <GateBanner gate={gateError} onDismiss={() => createUnit.reset()} />}
                  <DialogFooter>
                    <Button type="submit" disabled={createUnit.isPending} className="rounded-full">
                      Save
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      />

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
