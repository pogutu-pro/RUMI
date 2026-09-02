'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProperties, useCreateProperty, useUpdateProperty } from '@/features/rental/hooks/use-rental';
import { GateBanner } from '@/features/rental/components/gate-banner';
import { isGateRejection } from '@/lib/api/gate';
import { PageHeader } from '@/components/dashboard/page-header';
import type { Property } from '@/features/rental/types';

const propertySchema = z.object({
  name: z.string().trim().min(2, 'Property name is required').max(255),
  address: z.string().trim().min(5, 'Address is required').max(500),
  city: z.string().trim().max(100).optional(),
});

export default function PropertiesPage() {
  const { data: properties = [], isLoading } = useProperties();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const [open, setOpen] = React.useState(false);
  const [editingProperty, setEditingProperty] = React.useState<Property | null>(null);
  const gateError = isGateRejection(createProperty.error);

  const form = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: { name: '', address: '', city: 'Nairobi' },
  });

  const editForm = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: { name: '', address: '', city: '' },
  });

  const handleCreate = form.handleSubmit(async (values) => {
    try {
      await createProperty.mutateAsync(values);
      setOpen(false);
      form.reset();
    } catch {
      // handled via createProperty.error / isGateRejection in render
    }
  });

  const openEdit = (property: Property) => {
    setEditingProperty(property);
    editForm.reset({ name: property.name, address: property.address, city: property.city ?? '' });
  };

  const handleEdit = editForm.handleSubmit(async (values) => {
    if (!editingProperty) return;
    try {
      await updateProperty.mutateAsync({ id: editingProperty.id, payload: values });
      setEditingProperty(null);
      editForm.reset();
    } catch {
      // handled via updateProperty.error / toast in the hook
    }
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Properties"
        action={(
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button leftIcon={<Plus className="h-4 w-4" />}>Add property</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add property</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={handleCreate} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {gateError && <GateBanner gate={gateError} onDismiss={() => createProperty.reset()} />}
                  <DialogFooter>
                    <Button type="submit" disabled={createProperty.isPending} className="rounded-full">
                      Save
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      />

      <Dialog open={!!editingProperty} onOpenChange={(v) => { if (!v) setEditingProperty(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit property</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={handleEdit} className="space-y-3">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateProperty.isPending} className="rounded-full">
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">No properties yet — add your first one above.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
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
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/landlord/rental/properties/${p.id}`} className="text-primary underline">
                      View
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Edit property"
                      onClick={() => openEdit(p)}
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
