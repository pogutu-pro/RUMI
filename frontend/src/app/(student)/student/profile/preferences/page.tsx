'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Save, Moon, Volume2, Users, Coffee } from 'lucide-react';
import Link from 'next/link';

const preferencesSchema = z.object({
  sleepSchedule: z.string(),
  cleanliness: z.number().min(0).max(10),
  socialHabits: z.string(),
  guestsPolicy: z.string(),
  studyHabits: z.string(),
  smoking: z.boolean(),
  drinking: z.boolean(),
  pets: z.boolean(),
});

type PreferencesValues = z.infer<typeof preferencesSchema>;

export default function PreferencesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const defaultValues: Partial<PreferencesValues> = {
    sleepSchedule: 'midnight',
    cleanliness: 7,
    socialHabits: 'occasional',
    guestsPolicy: 'weekends',
    studyHabits: 'library',
    smoking: false,
    drinking: false,
    pets: false,
  };

  const form = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues,
  });

  async function onSubmit(data: PreferencesValues) {
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success('Preferences updated', {
        description: 'Your roommate matching preferences have been saved.',
      });
      
      router.refresh();
    } catch (error) {
      toast.error('Something went wrong', {
        description: 'Could not update preferences.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/student/profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Preferences</h1>
          <p className="text-muted-foreground">
            Set your living habits to find the perfect roommate match
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-emerald-600" />
                Daily Routine
              </CardTitle>
              <CardDescription>
                Help us understand your daily schedule and habits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="sleepSchedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typical Sleep Schedule</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sleep schedule" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="early">Early Bird (Before 10 PM)</SelectItem>
                        <SelectItem value="midnight">Night Owl (Around Midnight)</SelectItem>
                        <SelectItem value="late">Very Late (After 2 AM)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studyHabits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Study Environment Preference</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select study preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="room_quiet">In room (Absolute silence)</SelectItem>
                        <SelectItem value="room_music">In room (With music/noise)</SelectItem>
                        <SelectItem value="library">Library / Study Hall</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-emerald-600" />
                Living Habits
              </CardTitle>
              <CardDescription>
                Your preferences for cleanliness and social life.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={form.control}
                name="cleanliness"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-2">
                      <FormLabel>Cleanliness Level (1-10)</FormLabel>
                      <span className="text-sm font-medium text-muted-foreground">
                        {field.value} / 10
                      </span>
                    </div>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        defaultValue={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormDescription className="flex justify-between text-xs">
                      <span>Relaxed</span>
                      <span>Very Neat</span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="socialHabits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Habits</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select social habits" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="quiet">Prefer Quiet / Private</SelectItem>
                          <SelectItem value="occasional">Occasional Socializing</SelectItem>
                          <SelectItem value="outgoing">Very Outgoing / Social</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guestsPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guests Policy</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select guests policy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="never">No Guests</SelectItem>
                          <SelectItem value="weekends">Weekends Only</SelectItem>
                          <SelectItem value="anytime">Anytime</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                Lifestyle Choices
              </CardTitle>
              <CardDescription>
                Important deal-breakers for shared living.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="smoking"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Smoking</FormLabel>
                      <FormDescription>
                        Do you smoke or are you okay with a roommate who smokes?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="drinking"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Alcohol</FormLabel>
                      <FormDescription>
                        Do you drink alcohol or are you okay with it in the room?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pets"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Pets</FormLabel>
                      <FormDescription>
                        Do you have pets or plan to bring one?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/student/profile">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
