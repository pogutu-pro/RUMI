'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/dashboard/page-header';
import { useAuth, useProfile } from '@/features/auth';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notifications';

const profileSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  phone_number: z.string().trim(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const EMPTY_FORM: ProfileFormValues = {
  first_name: '',
  last_name: '',
  phone_number: '',
};

function ProfileTab() {
  const { data, isLoading } = useProfile();
  const { updateProfile, uploadPhoto } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: EMPTY_FORM,
  });

  React.useEffect(() => {
    if (!data) return;
    // GET /accounts/profile/ (UserProfileView -> FullUserProfileSerializer)
    // returns the user's own fields FLAT at the top level.
    const flat = data as unknown as {
      first_name?: string;
      last_name?: string;
      phone_number?: string;
      email?: string;
      profile_picture?: string;
    };
    form.reset({
      first_name: flat.first_name ?? '',
      last_name: flat.last_name ?? '',
      phone_number: flat.phone_number ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const email = React.useMemo(() => (data as unknown as { email?: string } | undefined)?.email ?? '', [data]);
  const currentImageUrl = React.useMemo(
    () => (data as unknown as { profile_picture?: string } | undefined)?.profile_picture ?? null,
    [data],
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await updateProfile(values);
      toast.success('Profile updated');
    } catch (err) {
      toast.error((err as { message?: string })?.message || 'Could not update profile');
    }
  });

  const handleImageChange = async (file: File | null) => {
    if (!file) return;
    try {
      await uploadPhoto(file);
      toast.success('Photo updated');
    } catch (err) {
      toast.error((err as { message?: string })?.message || 'Could not upload photo');
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="form" />;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <ImageUpload
          onImageChange={handleImageChange}
          currentImageUrl={currentImageUrl}
          label="Profile photo"
          className="max-w-36"
        />

        <div className="mt-6">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <p className="text-sm font-medium">{email}</p>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">First name</FormLabel>
                  <FormControl>
                    <Input className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Last name</FormLabel>
                  <FormControl>
                    <Input className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Phone number</FormLabel>
                  <FormControl>
                    <Input className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              Save changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function NotificationsTab() {
  const { data, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  if (isLoading) {
    return <LoadingSkeleton type="form" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rent reminders</CardTitle>
        <CardDescription>Choose how you want to hear about upcoming and overdue rent.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-xs text-muted-foreground">Receipts and rent reminders by email</p>
          </div>
          <Switch
            checked={data?.email_enabled ?? true}
            onCheckedChange={(checked) => update.mutate({ email_enabled: checked })}
            disabled={update.isPending}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">SMS</p>
            <p className="text-xs text-muted-foreground">Rent reminders by text message</p>
          </div>
          <Switch
            checked={data?.sms_enabled ?? true}
            onCheckedChange={(checked) => update.mutate({ sms_enabled: checked })}
            disabled={update.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsView() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your profile and how RumiaRent reaches you." />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
