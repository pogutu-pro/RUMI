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
import { useCaretakers, useCreateCaretaker, useProperties } from '@/features/rental/hooks/use-rental';
import { GateBanner } from '@/features/rental/components/gate-banner';
import { isGateRejection } from '@/lib/api/gate';
import { PageHeader } from '@/components/dashboard/page-header';

const KENYAN_PHONE_REGEX = /^(\+254|0)[17]\d{8}$/;

// WR-01: the backend (`CaretakerCreateSerializer`) only accepts the
// `+254XXXXXXXXX` format, but this schema's regex accepts the equally
// common local `0XXXXXXXXX` format too. Normalize to +254 before submit so
// a landlord who types the local format doesn't get a raw 400 from the API.
const normalizeKenyanPhone = (value: string) =>
  value.startsWith('0') ? `+254${value.slice(1)}` : value;

const caretakerSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name is required').max(150),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().regex(KENYAN_PHONE_REGEX, 'Enter a valid Kenyan phone number'),
  emergency_contact_name: z.string().trim().min(2, 'Emergency contact name is required').max(150),
  emergency_contact_phone: z.string().trim().regex(KENYAN_PHONE_REGEX, 'Enter a valid Kenyan phone number'),
});

const EMPTY_FORM = {
  full_name: '',
  email: '',
  phone: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

export default function CaretakersPage() {
  const { data: caretakers = [], isLoading } = useCaretakers();
  const { data: properties = [] } = useProperties();
  const createCaretaker = useCreateCaretaker();
  const [open, setOpen] = React.useState(false);
  const [propertyIds, setPropertyIds] = React.useState<string[]>([]);
  const gateError = isGateRejection(createCaretaker.error);

  const form = useForm<z.infer<typeof caretakerSchema>>({
    resolver: zodResolver(caretakerSchema),
    defaultValues: EMPTY_FORM,
  });

  const togglePropertyId = (id: string) => {
    setPropertyIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleCreate = form.handleSubmit(async (values) => {
    try {
      await createCaretaker.mutateAsync({
        ...values,
        phone: normalizeKenyanPhone(values.phone),
        emergency_contact_phone: normalizeKenyanPhone(values.emergency_contact_phone),
        property_ids: propertyIds,
      });
      setOpen(false);
      form.reset();
      setPropertyIds([]);
    } catch {
      // handled via createCaretaker.error / isGateRejection in render
    }
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Caretakers"
        action={(
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button leftIcon={<Plus className="h-4 w-4" />}>Add caretaker</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Add caretaker</DialogTitle>
                <DialogDescription>
                  Give a caretaker access to manage the properties you choose. They&apos;ll be emailed a link to set their password.
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
                          <Input {...field} placeholder="e.g. Peter Otieno" className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormRow>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="name@example.com" className="h-11" />
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
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="0712 345 678" className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </FormRow>

                  <FormSection title="Emergency contact" description="Who we call if the caretaker can&apos;t be reached.">
                    <FormRow>
                      <FormField
                        control={form.control}
                        name="emergency_contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emergency_contact_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="0712 345 678" className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FormRow>
                  </FormSection>

                  {properties.length > 0 && (
                    <FormSection title="Assign to properties" description="They can only see and manage the properties you tick.">
                      <div className="space-y-2">
                        {properties.map((p) => (
                          <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/40">
                            <Checkbox
                              checked={propertyIds.includes(p.id)}
                              onCheckedChange={() => togglePropertyId(p.id)}
                            />
                            {p.name}
                          </label>
                        ))}
                      </div>
                    </FormSection>
                  )}
                  {gateError && <GateBanner gate={gateError} onDismiss={() => createCaretaker.reset()} />}
                  <FormDialogActions submitLabel="Save" isPending={createCaretaker.isPending} />
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : caretakers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No caretakers yet — add the first one above.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {caretakers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>
                  {c.assigned_properties.length === 0
                    ? <span className="text-muted-foreground">None</span>
                    : c.assigned_properties.map((p) => p.name).join(', ')}
                </TableCell>
                <TableCell>
                  <Badge variant={c.is_active ? 'default' : 'secondary'}>
                    {c.is_active ? 'Active' : 'Inactive'}
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
