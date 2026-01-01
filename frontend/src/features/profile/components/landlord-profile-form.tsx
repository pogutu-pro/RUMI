'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateLandlordProfile } from '@/features/profile';

const schema = z.object({
  company_name: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  kra_pin: z.string().optional(),
  numberOfProperties: z.number().min(0),
  bank_account_number: z.string().optional(),
  bio: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LandlordProfileForm({ initialData }: { initialData?: FormValues }) {
  const updateProfile = useUpdateLandlordProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  function onSubmit(data: FormValues) {
    updateProfile.mutate(data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Landlord Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="company_name" render={({ field }) => (
              <FormItem><FormLabel>Company Name (Optional)</FormLabel><FormControl>
                <Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="businessRegistrationNumber" render={({ field }) => (
              <FormItem><FormLabel>Business Registration Number</FormLabel><FormControl>
                <Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="kra_pin" render={({ field }) => (
              <FormItem><FormLabel>Tax PIN (KRA)</FormLabel><FormControl>
                <Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="numberOfProperties" render={({ field }) => (
              <FormItem><FormLabel>Number of Properties</FormLabel><FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
              </FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="bank_account_number" render={({ field }) => (
              <FormItem><FormLabel>Bank Account Number</FormLabel><FormControl>
                <Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem><FormLabel>Bio</FormLabel><FormControl>
                <Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
