'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useTenancies, useCreateTenancy, useTerminateTenancy, useUnits, useTenants,
} from '@/features/rental/hooks/use-rental';

const tenancySchema = z.object({
  unit: z.string().min(1, 'Choose a unit'),
  tenant: z.string().min(1, 'Choose a tenant'),
  monthly_rent: z.string().min(1, 'Monthly rent is required'),
  start_date: z.string().optional(),
});

type TenancyFormValues = z.infer<typeof tenancySchema>;

const EMPTY_FORM: TenancyFormValues = { unit: '', tenant: '', monthly_rent: '', start_date: '' };

export default function TenanciesPage() {
  const { data: tenancies = [], isLoading } = useTenancies();
  const { data: units = [] } = useUnits();
  const { data: tenants = [] } = useTenants();
  const createTenancy = useCreateTenancy();
  const terminateTenancy = useTerminateTenancy();

  const [open, setOpen] = React.useState(false);

  const form = useForm<TenancyFormValues>({
    resolver: zodResolver(tenancySchema),
    defaultValues: EMPTY_FORM,
  });

  const vacantUnits = units.filter((u) => u.status !== 'occupied');

  const handleCreate = form.handleSubmit(async (values) => {
    await createTenancy.mutateAsync({
      ...values,
      status: 'active',
      start_date: values.start_date || new Date().toISOString().slice(0, 10),
    });
    setOpen(false);
    form.reset(EMPTY_FORM);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tenancies</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New tenancy</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New tenancy</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <div className="space-y-3">
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
              </div>
            </Form>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createTenancy.isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tenancies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tenancies yet.</p>
      ) : (
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
            {tenancies.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.tenant_name}</TableCell>
                <TableCell>{t.unit_number}</TableCell>
                <TableCell>KES {t.monthly_rent}</TableCell>
                <TableCell>
                  <Badge variant={t.status === 'active' ? 'default' : 'secondary'}>{t.status}</Badge>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
