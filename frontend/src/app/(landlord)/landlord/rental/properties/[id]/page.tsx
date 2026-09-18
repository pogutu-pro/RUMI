'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormDialogActions, FormRow } from '@/components/ui/form-layout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProperty, useUnits, useCreateUnit, useUpdateUnit } from '@/features/rental/hooks/use-rental';
import { GateBanner } from '@/features/rental/components/gate-banner';
import { isGateRejection } from '@/lib/api/gate';
import { PageHeader } from '@/components/dashboard/page-header';
import type { RentalUnit } from '@/features/rental/types';

const UNIT_TYPES = ['studio', 'bedsitter', '1_bedroom', '2_bedroom', '3_bedroom', '4_bedroom', 'house', 'other'] as const;
const UNIT_STATUSES = ['vacant', 'occupied', 'reserved', 'maintenance'] as const;

const unitSchema = z.object({
  unit_number: z.string().trim().min(1, 'Unit number is required').max(50),
  unit_type: z.enum(UNIT_TYPES),
  monthly_rent: z.coerce.number().positive('Monthly rent must be greater than 0'),
});

const unitEditSchema = unitSchema.extend({
  status: z.enum(UNIT_STATUSES),
});

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const propertyId = params.id;
  const { data: property } = useProperty(propertyId);
  const { data: units = [], isLoading } = useUnits(propertyId);
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();

  const [open, setOpen] = React.useState(false);
  const [editingUnit, setEditingUnit] = React.useState<RentalUnit | null>(null);
  const gateError = isGateRejection(createUnit.error);

  const form = useForm<z.input<typeof unitSchema>, unknown, z.output<typeof unitSchema>>({
    resolver: zodResolver(unitSchema),
    defaultValues: { unit_number: '', unit_type: '1_bedroom', monthly_rent: 0 },
  });

  const editForm = useForm<z.input<typeof unitEditSchema>, unknown, z.output<typeof unitEditSchema>>({
    resolver: zodResolver(unitEditSchema),
    defaultValues: { unit_number: '', unit_type: '1_bedroom', monthly_rent: 0, status: 'vacant' },
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

  const openEdit = (unit: RentalUnit) => {
    setEditingUnit(unit);
    editForm.reset({
      unit_number: unit.unit_number,
      unit_type: unit.unit_type as (typeof UNIT_TYPES)[number],
      monthly_rent: Number(unit.monthly_rent),
      status: unit.status,
    });
  };

  const handleEdit = editForm.handleSubmit(async (values) => {
    if (!editingUnit) return;
    try {
      await updateUnit.mutateAsync({
        id: editingUnit.id,
        payload: { ...values, monthly_rent: String(values.monthly_rent) },
      });
      setEditingUnit(null);
      editForm.reset();
    } catch {
      // handled via updateUnit.error / toast in the hook
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
                <DialogDescription>
                  Add a rentable unit to this property. Tenants are attached to units.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={handleCreate} className="space-y-5">
                  <FormRow>
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
                              <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </FormRow>
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
                  <FormDialogActions submitLabel="Save" isPending={createUnit.isPending} />
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      />

      <Dialog open={!!editingUnit} onOpenChange={(v) => { if (!v) setEditingUnit(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit unit</DialogTitle>
            <DialogDescription>Update this unit&apos;s details or availability.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={handleEdit} className="space-y-5">
              <FormRow>
              <FormField
                control={editForm.control}
                name="unit_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit number</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
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
                          <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </FormRow>
              <FormRow>
              <FormField
                control={editForm.control}
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
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </FormRow>
              <FormDialogActions submitLabel="Save changes" isPending={updateUnit.isPending} />
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
                  <div className="flex items-center gap-2">
                    <Badge variant={u.status === 'occupied' ? 'default' : u.status === 'vacant' ? 'secondary' : 'destructive'}>
                      {u.status}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Edit unit"
                      onClick={() => openEdit(u)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
