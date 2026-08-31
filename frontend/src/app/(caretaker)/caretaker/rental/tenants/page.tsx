'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTenants, useCreateTenant } from '@/features/rental/hooks/use-rental';

const tenantSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required'),
  phone: z.string().trim(),
  email: z.string().trim().email('Enter a valid email').or(z.literal('')),
  nok_full_name: z.string().trim(),
  nok_relationship: z.string().trim(),
  nok_phone: z.string().trim(),
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

export default function CaretakerTenantsPage() {
  const { data: tenants = [], isLoading } = useTenants();
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tenants</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add tenant</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add tenant</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={handleCreate} className="space-y-3">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Full name</FormLabel>
                      <FormControl>
                        <Input className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Phone</FormLabel>
                      <FormControl>
                        <Input className="h-11" {...field} />
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
                      <FormLabel className="font-semibold">Email</FormLabel>
                      <FormControl>
                        <Input className="h-11" type="email" {...field} />
                      </FormControl>
                      <p className="mt-1 text-xs text-muted-foreground">
                        They&apos;ll get an email to set up their password once attached to a unit.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2 border-t">
                  <p className="mb-2 text-sm font-medium">Next of kin (optional)</p>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="nok_full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Full name</FormLabel>
                          <FormControl>
                            <Input className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nok_relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Relationship</FormLabel>
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
                          <FormLabel className="font-semibold">Phone</FormLabel>
                          <FormControl>
                            <Input className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nok_authorized"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              className="mt-0.5"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal leading-normal text-muted-foreground">
                            Contact this person about rent if the tenant falls behind and can&apos;t be
                            reached. Off by default; only used with this consent.
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createTenant.isPending}>
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tenants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tenants yet — add the first one above.</p>
      ) : (
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
            {tenants.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.full_name}</TableCell>
                <TableCell>{t.phone}</TableCell>
                <TableCell>{t.email}</TableCell>
                <TableCell><Badge variant="secondary">{t.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
