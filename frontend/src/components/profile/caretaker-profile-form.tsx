'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateCaretakerProfile } from '@/hooks/use-profile';

const schema = z.object({
  yearsOfExperience: z.number().min(0),
  specializations: z.string().optional(),
  certifications: z.string().optional(),
  availability: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CaretakerProfileForm({ initialData }: { initialData?: FormValues }) {
  const updateProfile = useUpdateCaretakerProfile();

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
        <CardTitle>Caretaker Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="yearsOfExperience" render={({ field }) => (
              <FormItem><FormLabel>Years of Experience</FormLabel><FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
              </FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="specializations" render={({ field }) => (
              <FormItem><FormLabel>Specializations</FormLabel><FormControl>
                <Input placeholder="e.g., Plumbing, Electrical" {...field} />
              </FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="certifications" render={({ field }) => (
              <FormItem><FormLabel>Certifications</FormLabel><FormControl>
                <Input {...field} />
              </FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="availability" render={({ field }) => (
              <FormItem><FormLabel>Availability</FormLabel><FormControl>
                <Input placeholder="e.g., Monday-Friday 8AM-5PM" {...field} />
              </FormControl><FormMessage /></FormItem>
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
