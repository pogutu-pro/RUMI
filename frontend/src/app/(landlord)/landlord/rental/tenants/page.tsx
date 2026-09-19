'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormDialogActions, FormRow, FormSection } from '@/components/ui/form-layout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTenants, useCreateTenant } from '@/features/rental/hooks/use-rental';
import { PageHeader } from '@/components/dashboard/page-header';
import { usePagination } from '@/hooks/use-pagination';
import { SimplePager } from '@/components/ui/simple-pager';

const tenantSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name is required').max(150),
  phone: z.string().trim().min(1, 'Phone is required'),
  email: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
  nok_full_name: z.string().trim().optional(),
  nok_relationship: z.string().trim().optional(),
  nok_phone: z.string().trim().optional(),
  nok_authorized: z.boolean(),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

const EMPTY_FORM: TenantFormValues = {
  full_name: '',
  phone: '',
  email: '',
  nok_full_name: '',
  nok_relationship: '',
  nok_phone: '',
  nok_authorized: false,
};

export default function TenantsPage() {
  const { data: tenants = [], isLoading } = useTenants();
  const { pageItems: pagedTenants, pagerProps: tenantsPager } = usePagination(tenants, 10);
  const createTenant = useCreateTenant();
  const [open, setOpen] = React.useState(false);

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: EMPTY_FORM,
  });

  const handleCreate = form.handleSubmit(async (values) => {
    const emergency_contacts = values.nok_full_name
      ? [{
          full_name: values.nok_full_name,
          relationship: values.nok_relationship,
          phone: values.nok_phone,
          is_primary: true,
          purpose: values.nok_authorized ? 'rent_escalation_authorized' : 'emergency_only',
          consent_given: values.nok_authorized,
        }]
      : [];

    await createTenant.mutateAsync({
      full_name: values.full_name,
      phone: values.phone,
      email: values.email,
      emergency_contacts,
    });
    setOpen(false);
    form.reset(EMPTY_FORM);
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tenants"
        action={(
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button leftIcon={<Plus className="h-4 w-4" />}>Add tenant</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Add tenant</DialogTitle>
                <DialogDescription>
                  Add a tenant to your records. You can attach them to a unit afterwards.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={handleCreate} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input className="h-11" placeholder="e.g. Jane Wanjiku" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormRow>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input className="h-11" type="tel" placeholder="0712 345 678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input className="h-11" type="email" placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </FormRow>
                  <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">
                    They&apos;ll get an email to set up their password once attached to a unit.
                  </p>

                  <FormSection title="Next of kin (optional)" description="Someone we can reach in an emergency.">
                    <div className="space-y-5">
                      <FormField
                        control={form.control}
                        name="nok_full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl>
                              <Input className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormRow>
                      <FormField
                        control={form.control}
                        name="nok_relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <FormControl>
                              <Input className="h-11" placeholder="Parent, sibling, spouse..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nok_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      </FormRow>
                      <FormField
                        control={form.control}
                        name="nok_authorized"
                        render={({ field }) => (
                          <FormItem className="flex items-start gap-3 space-y-0 rounded-lg bg-muted/40 p-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-0.5"
                              />
                            </FormControl>
                            <span className="text-xs leading-relaxed text-muted-foreground">
                              Contact this person about rent if the tenant falls behind and can&apos;t be
                              reached. Off by default; only used with this consent.
                            </span>
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormSection>

                  <FormDialogActions submitLabel="Save" isPending={createTenant.isPending} />
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tenants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tenants yet — add the first one above.</p>
      ) : (
        <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedTenants.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.full_name}</TableCell>
                <TableCell>{t.phone}</TableCell>
                <TableCell>{t.email}</TableCell>
                <TableCell><Badge variant="secondary">{t.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <SimplePager {...tenantsPager} />
        </>
      )}
    </div>
  );
}
