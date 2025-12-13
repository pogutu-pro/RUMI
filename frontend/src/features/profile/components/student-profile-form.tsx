'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateStudentProfile } from '@/features/profile';

const schema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  course: z.string().min(1, 'Course is required'),
  yearOfStudy: z.number().min(1).max(7),
  studentId: z.string().min(1, 'Student ID is required'),
  emergencyContact: z.string().min(10, 'Invalid phone number'),
  emergencyContactName: z.string().min(1, 'Contact name is required'),
});

type FormValues = z.infer<typeof schema>;

export function StudentProfileForm({ initialData }: { initialData?: FormValues }) {
  const updateProfile = useUpdateStudentProfile();

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
        <CardTitle>Student Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="institution" render={({ field }) => (
              <FormItem><FormLabel>Institution</FormLabel><FormControl>
                <Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="course" render={({ field }) => (
              <FormItem><FormLabel>Course</FormLabel><FormControl>
                <Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="yearOfStudy" render={({ field }) => (
              <FormItem><FormLabel>Year of Study</FormLabel><FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
              </FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="studentId" render={({ field }) => (
              <FormItem><FormLabel>Student ID</FormLabel><FormControl>
                <Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
              <FormItem><FormLabel>Emergency Contact Name</FormLabel><FormControl>
                <Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="emergencyContact" render={({ field }) => (
              <FormItem><FormLabel>Emergency Contact Phone</FormLabel><FormControl>
                <Input {...field} /></FormControl><FormMessage /></FormItem>
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
