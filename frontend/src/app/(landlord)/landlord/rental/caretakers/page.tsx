'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCaretakers, useCreateCaretaker, useProperties } from '@/features/rental/hooks/use-rental';
import { GateBanner } from '@/features/rental/components/gate-banner';
import { isGateRejection } from '@/lib/api/gate';

const KENYAN_PHONE_REGEX = /^(\+254|0)[17]\d{8}$/;

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
      await createCaretaker.mutateAsync({ ...values, property_ids: propertyIds });
      setOpen(false);
      form.reset();
      setPropertyIds([]);
    } catch {
      // handled via createCaretaker.error / isGateRejection in render
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Caretakers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add caretaker</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add caretaker</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form className="space-y-3">
                <FormField
                  control={form.control}
                  name="full_name"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" className="h-11" />
                      </FormControl>
                      <p className="mt-1 text-xs text-muted-foreground">
                        They&apos;ll get an email to set up their password.
                      </p>
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
                        <Input {...field} placeholder="+254712345678" className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2 border-t">
                  <p className="mb-2 text-sm font-semibold">Emergency contact</p>
                  <div className="space-y-3">
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
                            <Input {...field} placeholder="+254712345678" className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {properties.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="mb-2 text-sm font-semibold">Assign to properties</p>
                    <div className="space-y-2">
                      {properties.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={propertyIds.includes(p.id)}
                            onCheckedChange={() => togglePropertyId(p.id)}
                          />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </Form>
            {gateError && <GateBanner gate={gateError} onDismiss={() => createCaretaker.reset()} />}
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createCaretaker.isPending} className="rounded-full">
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
