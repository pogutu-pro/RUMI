'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormDialogActions, FormRow } from '@/components/ui/form-layout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useTenancies, useCreateTenancy, useUpdateTenancy, useTerminateTenancy, useUnits, useTenants,
} from '@/features/rental/hooks/use-rental';
import { PageHeader } from '@/components/dashboard/page-header';
import type { Tenancy } from '@/features/rental/types';
import { usePagination } from '@/hooks/use-pagination';
import { SimplePager } from '@/components/ui/simple-pager';

const tenancySchema = z.object({
  unit: z.string().min(1, 'Choose a unit'),
  tenant: z.string().min(1, 'Choose a tenant'),
  monthly_rent: z.string().min(1, 'Monthly rent is required'),
  start_date: z.string().optional(),
});

type TenancyFormValues = z.infer<typeof tenancySchema>;

const EMPTY_FORM: TenancyFormValues = { unit: '', tenant: '', monthly_rent: '', start_date: '' };

// Mirrors Backend/rumia_api/views.py TenancyDetailView.PATCHABLE_FIELDS exactly —
// status is deliberately excluded; status transitions go through "Terminate" only.
const tenancyEditSchema = z.object({
  monthly_rent: z.coerce.number().positive('Monthly rent must be greater than 0'),
  deposit: z.coerce.number().min(0, 'Deposit cannot be negative'),
  rent_due_day: z.coerce.number().int().min(1, 'Must be between 1 and 28').max(28, 'Must be between 1 and 28'),
  grace_period_days: z.coerce.number().int().min(0, 'Cannot be negative'),
  end_date: z.string().optional(),
  renewal_notes: z.string().max(1000, 'Max 1000 characters').optional(),
  notes: z.string().max(1000, 'Max 1000 characters').optional(),
});

const EMPTY_EDIT_FORM = {
  monthly_rent: 0,
  deposit: 0,
  rent_due_day: 1,
  grace_period_days: 0,
  end_date: '',
  renewal_notes: '',
  notes: '',
};

export default function TenanciesPage() {
  const { data: tenancies = [], isLoading } = useTenancies();
  const { pageItems: pagedTenancies, pagerProps: tenanciesPager } = usePagination(tenancies, 10);
  const { data: units = [] } = useUnits();
  const { data: tenants = [] } = useTenants();
  const createTenancy = useCreateTenancy();
  const updateTenancy = useUpdateTenancy();
  const terminateTenancy = useTerminateTenancy();

  const [open, setOpen] = React.useState(false);
  const [editingTenancy, setEditingTenancy] = React.useState<Tenancy | null>(null);

  const form = useForm<TenancyFormValues>({
    resolver: zodResolver(tenancySchema),
    defaultValues: EMPTY_FORM,
  });

  const editForm = useForm<z.input<typeof tenancyEditSchema>, unknown, z.output<typeof tenancyEditSchema>>({
    resolver: zodResolver(tenancyEditSchema),
    defaultValues: EMPTY_EDIT_FORM,
  });

  const vacantUnits = units.filter((u) => u.status !== 'occupied');

  const handleCreate = form.handleSubmit(async (values) => {
    try {
      await createTenancy.mutateAsync({
        ...values,
        status: 'active',
        start_date: values.start_date || new Date().toISOString().slice(0, 10),
      });
      setOpen(false);
      form.reset(EMPTY_FORM);
    } catch {
      // handled via createTenancy.error / toast in the hook
    }
  });

  const openEdit = (tenancy: Tenancy) => {
    setEditingTenancy(tenancy);
    editForm.reset({
      monthly_rent: Number(tenancy.monthly_rent),
      deposit: Number(tenancy.deposit),
      rent_due_day: tenancy.rent_due_day,
      grace_period_days: tenancy.grace_period_days,
      end_date: tenancy.end_date ?? '',
      renewal_notes: tenancy.renewal_notes ?? '',
      notes: tenancy.notes ?? '',
    });
  };

  const handleEdit = editForm.handleSubmit(async (values) => {
    if (!editingTenancy) return;
    const payload: Record<string, unknown> = {
      monthly_rent: String(values.monthly_rent),
      deposit: String(values.deposit),
      rent_due_day: values.rent_due_day,
      grace_period_days: values.grace_period_days,
      renewal_notes: values.renewal_notes ?? '',
      notes: values.notes ?? '',
    };
    if (values.end_date) payload.end_date = values.end_date;
    try {
      await updateTenancy.mutateAsync({ id: editingTenancy.id, payload });
      setEditingTenancy(null);
      editForm.reset(EMPTY_EDIT_FORM);
    } catch {
      // handled via updateTenancy.error / toast in the hook
    }
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tenancies"
        action={(
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button leftIcon={<Plus className="h-4 w-4" />}>New tenancy</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>New tenancy</DialogTitle>
                <DialogDescription>
                  Attach a tenant to a vacant unit. Rent charges are generated from the start date.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={handleCreate} className="space-y-5">
                  <FormRow>
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                            const unit = units.find((u) => u.id === v);
                            if (unit?.monthly_rent) form.setValue('monthly_rent', unit.monthly_rent);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Choose a vacant unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vacantUnits.map((u) => (
                              <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tenant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Choose a tenant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tenants.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
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
                    control={form.control}
                    name="monthly_rent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly rent (KES)</FormLabel>
                        <FormControl>
                          <Input className="h-11" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start date</FormLabel>
                        <FormControl>
                          <Input className="h-11" type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </FormRow>
                  <FormDialogActions submitLabel="Create tenancy" isPending={createTenancy.isPending} />
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      />

      <Dialog open={!!editingTenancy} onOpenChange={(v) => { if (!v) setEditingTenancy(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit tenancy</DialogTitle>
            <DialogDescription>Changes apply to future rent charges. Charges already generated are not rewritten.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={handleEdit} className="space-y-5">
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
                name="deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit (KES)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" className="h-11" value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </FormRow>
              <FormRow>
              <FormField
                control={editForm.control}
                name="rent_due_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rent due day (1-28)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" className="h-11" value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="grace_period_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grace period (days)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" className="h-11" value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </FormRow>
              <FormField
                control={editForm.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="renewal_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewal notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormDialogActions submitLabel="Save changes" isPending={updateTenancy.isPending} />
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tenancies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tenancies yet.</p>
      ) : (
        <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedTenancies.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.tenant_name}</TableCell>
                <TableCell>{t.unit_number}</TableCell>
                <TableCell>KES {t.monthly_rent}</TableCell>
                <TableCell>
                  <Badge variant={t.status === 'active' ? 'default' : 'secondary'}>{t.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Edit tenancy"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {t.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={terminateTenancy.isPending}
                        onClick={() => terminateTenancy.mutate({ id: t.id })}
                      >
                        Terminate
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <SimplePager {...tenanciesPager} />
        </>
      )}
    </div>
  );
}
