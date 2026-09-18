'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useAuth, useProfile } from '@/features/auth';

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

/**
 * Tenant profile page (D-07). Reuses the existing, already-implemented
 * useProfile()/useAuth().updateProfile()/uploadPhoto() machinery in
 * frontend/src/features/auth/ — GET/PUT /accounts/profile/ and
 * POST /accounts/profile/picture/ already exist server-side; no new
 * backend endpoint is introduced by this page.
 */
export default function TenantProfilePage() {
  const { data, isLoading } = useProfile();
  const { updateProfile, uploadPhoto } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: EMPTY_FORM,
  });

  React.useEffect(() => {
    if (!data) return;
    // GET /accounts/profile/ (UserProfileView -> FullUserProfileSerializer)
    // returns the user's own fields FLAT at the top level — see the same
    // cast pattern documented in useProfile() (use-auth.ts).
    const flat = data as unknown as {
      first_name?: string;
      last_name?: string;
      phone_number?: string;
      profile_picture?: string;
    };
    form.reset({
      first_name: flat.first_name ?? '',
      last_name: flat.last_name ?? '',
      phone_number: flat.phone_number ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const currentImageUrl = React.useMemo(() => {
    const flat = data as unknown as { profile_picture?: string } | undefined;
    return flat?.profile_picture ?? null;
  }, [data]);

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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            onImageChange={handleImageChange}
            currentImageUrl={currentImageUrl}
            label="Profile photo"
            className="max-w-36"
          />

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
    </div>
  );
}
