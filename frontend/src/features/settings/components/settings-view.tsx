'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormRow } from '@/components/ui/form-layout';
import { PageHeader } from '@/components/dashboard/page-header';
import { cn } from '@/lib/utils/cn';
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
          <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-5">
            <FormRow>
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
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
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input className="h-11" type="tel" placeholder="0712 345 678" {...field} />
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
            <p className="text-xs text-muted-foreground">Rent reminders by text message — always on</p>
          </div>
          <Switch checked disabled />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">News and updates</p>
            <p className="text-xs text-muted-foreground">
              Product news and tips from RumiaRent. Off unless you turn it on.
            </p>
          </div>
          <Switch
            checked={data?.marketing_emails ?? false}
            onCheckedChange={(checked) => update.mutate({ marketing_emails: checked })}
            disabled={update.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun, page: 'bg-[#faf9f7]', card: 'bg-white', line: 'bg-[#e4e0da]' },
  { value: 'dark', label: 'Dark', icon: Moon, page: 'bg-[#17181b]', card: 'bg-[#1f2023]', line: 'bg-[#34363a]' },
  { value: 'system', label: 'System', icon: Monitor, page: 'bg-[linear-gradient(90deg,#faf9f7_50%,#17181b_50%)]', card: 'bg-[linear-gradient(90deg,#fff_50%,#1f2023_50%)]', line: 'bg-[#9ca3af]' },
] as const;

/** Light, Dark, or follow the phone or computer. Light is the default. */
function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  // next-themes only knows the saved choice in the browser; render neutral first.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const active = mounted ? (theme ?? 'light') : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
        <CardDescription>Light is easiest to read outdoors. Dark is gentler at night.</CardDescription>
      </CardHeader>
      <CardContent>
        <div role="radiogroup" aria-label="Theme" className="grid max-w-md grid-cols-3 gap-3">
          {THEMES.map(({ value, label, icon: Icon, page, card, line }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active === value}
              onClick={() => setTheme(value)}
              className={cn(
                'rounded-xl border p-2 text-left transition-colors',
                active === value ? 'border-primary ring-2 ring-primary/30' : 'hover:border-foreground/30',
              )}
            >
              <span className={cn('block h-14 rounded-lg p-2', page)} aria-hidden="true">
                <span className={cn('block h-full rounded-md p-1.5 shadow-sm', card)}>
                  <span className={cn('block h-1.5 w-3/4 rounded-full', line)} />
                  <span className={cn('mt-1.5 block h-1.5 w-1/2 rounded-full', line)} />
                </span>
              </span>
              <span className="mt-2 flex items-center gap-1.5 text-sm font-medium">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** The only sign-out control in the app; kept out of the way on purpose. */
function SignOutSection() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = React.useState(false);
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Sign out</p>
          <p className="text-xs text-muted-foreground">
            {user?.email ? `Signed in as ${user.email}. ` : ''}Sign out on shared or borrowed devices.
          </p>
        </div>
        <Button
          variant="outline"
          className="sm:w-auto"
          isLoading={busy}
          onClick={async () => {
            setBusy(true);
            await logout();
          }}
        >
          Sign out
        </Button>
      </CardContent>
    </Card>
  );
}

export function SettingsView() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your profile, how RumiaRent reaches you, and how it looks." />
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
      <AppearanceCard />
      <SignOutSection />
    </div>
  );
}
