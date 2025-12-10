'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const schema = z.object({
  sleepSchedule: z.enum(['early', 'late', 'flexible']),
  cleanliness: z.enum(['very_clean', 'clean', 'moderate']),
  socialLevel: z.enum(['very_social', 'social', 'quiet']),
  smokingAllowed: z.boolean(),
  petsAllowed: z.boolean(),
  guestsAllowed: z.boolean(),
  musicPreference: z.enum(['quiet', 'moderate', 'loud']),
  studyHabits: z.enum(['library', 'room', 'flexible']),
});

type FormValues = z.infer<typeof schema>;

export function LifestylePreferencesForm({ initialData }: { initialData?: Partial<FormValues> }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      sleepSchedule: 'flexible',
      cleanliness: 'clean',
      socialLevel: 'social',
      smokingAllowed: false,
      petsAllowed: false,
      guestsAllowed: true,
      musicPreference: 'moderate',
      studyHabits: 'flexible',
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Lifestyle preferences updated');
    } catch {
      toast.error('Failed to update preferences');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lifestyle Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="sleepSchedule" render={({ field }) => (
              <FormItem>
                <FormLabel>Sleep Schedule</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="early">Early Bird (Before 10 PM)</SelectItem>
                    <SelectItem value="late">Night Owl (After Midnight)</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="cleanliness" render={({ field }) => (
              <FormItem>
                <FormLabel>Cleanliness Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="very_clean">Very Clean</SelectItem>
                    <SelectItem value="clean">Clean</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="socialLevel" render={({ field }) => (
              <FormItem>
                <FormLabel>Social Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="very_social">Very Social</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="quiet">Quiet & Private</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="smokingAllowed" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Smoking Allowed</FormLabel>
                  <FormDescription>Allow smoking in the room</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="petsAllowed" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Pets Allowed</FormLabel>
                  <FormDescription>Allow pets in the room</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="guestsAllowed" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Guests Allowed</FormLabel>
                  <FormDescription>Allow overnight guests</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <Button type="submit">Save Preferences</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
