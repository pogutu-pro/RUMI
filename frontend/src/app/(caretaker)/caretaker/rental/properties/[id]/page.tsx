'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormDialogActions, FormRow } from '@/components/ui/form-layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProperty, useUnits } from '@/features/rental/hooks/use-rental';
import { useCreateTicket } from '@/features/support/hooks/use-support';
import type { TicketPriority } from '@/features/support/types/types';

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const maintenanceRequestSchema = z.object({
  subject: z.string().trim().min(3, 'Subject is required'),
  description: z.string().trim().min(10, 'Please describe the issue in a bit more detail'),
  unit: z.string().min(1, 'Choose a unit'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

type MaintenanceRequestFormValues = z.infer<typeof maintenanceRequestSchema>;

const EMPTY_MAINTENANCE_FORM: MaintenanceRequestFormValues = {
  subject: '', description: '', unit: '', priority: 'medium',
};

export default function CaretakerPropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const propertyId = params.id;
  const { data: property, isError, refetch } = useProperty(propertyId);
  const { data: units = [], isLoading: unitsLoading } = useUnits(propertyId);
  const createTicket = useCreateTicket();
  const [open, setOpen] = React.useState(false);

  const form = useForm<MaintenanceRequestFormValues>({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: EMPTY_MAINTENANCE_FORM,
  });

  const handleCreate = form.handleSubmit(async (values) => {
    await createTicket.mutateAsync({ ...values, category: 'maintenance' });
    setOpen(false);
    form.reset(EMPTY_MAINTENANCE_FORM);
  });

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={property?.name ?? 'Property'}
        description={property ? `${property.address}, ${property.city}` : undefined}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button leftIcon={<Wrench className="h-4 w-4" />}>Log maintenance request</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log maintenance request</DialogTitle>
            <DialogDescription>
              Report an issue at this property so it can be tracked through to resolution.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleCreate} className="space-y-5">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe the issue</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((u) => (
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(PRIORITY_LABEL) as TicketPriority[]).map((p) => (
                          <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormDialogActions submitLabel="Log request" isPending={createTicket.isPending} />
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {unitsLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : units.length === 0 ? (
        <EmptyState
          variant="add"
          title="No units yet"
          description="Units for this property haven't been added yet."
        />
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
