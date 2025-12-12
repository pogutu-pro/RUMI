'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const schema = z.object({
  bio: z.string().max(500).optional(),
  isLookingForRoommate: z.boolean(),
  preferredGender: z.enum(['male', 'female', 'any']).optional(),
  ageRange: z.string().optional(),
  interests: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function RoommateProfileForm({ initialData }: { initialData?: Partial<FormValues> }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      isLookingForRoommate: false,
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Roommate preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roommate Matching Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="isLookingForRoommate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Looking for Roommate</FormLabel>
                    <FormDescription>
                      Enable roommate matching to find compatible roommates
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Me</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell potential roommates about yourself..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of yourself and what you're looking for in a roommate
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests & Hobbies</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Reading, Sports, Music..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">Save Profile</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
