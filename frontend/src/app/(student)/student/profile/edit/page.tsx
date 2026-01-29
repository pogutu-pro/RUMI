'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/features/auth';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Upload, User, ArrowLeft, Save, ShieldCheck, Lock, Phone } from 'lucide-react';
import Link from 'next/link';

// Profile Settings Schema - Focused on Private Data
const profileFormSchema = z.object({
  // Private Personal Details
  first_name: z.string().min(2, { message: 'First name is required.' }),
  last_name: z.string().min(2, { message: 'Last name is required.' }),
  email: z.string().email(),
  phone_number: z.string().min(10, { message: 'Valid phone number is required.' }),
  bio: z.string().max(500).optional(),
  
  // Emergency Contact (Private - Critical for Safety)
  emergency_contact_name: z.string().min(2, { message: 'Emergency contact name is required.' }),
  emergency_contact_phone: z.string().min(10, { message: 'Emergency contact phone is required.' }),
  emergency_contact_relationship: z.string().min(2, { message: 'Relationship is required (e.g. Parent, Sibling).' }),

  // Socials (Can be edited here too)
  urls: z.object({
    instagram: z.string().optional().or(z.literal('')),
    tiktok: z.string().optional().or(z.literal('')),
  }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function EditProfilePage() {
  const router = useRouter();
  const { user, profile, updateProfile, uploadPhoto } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [avatarKey, setAvatarKey] = React.useState(Date.now());

  // Default values
  const defaultValues: Partial<ProfileFormValues> = {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    bio: (profile as any)?.bio || user?.bio || '',
    
    // Emergency Contact Defaults
    emergency_contact_name: (profile as any)?.emergency_contact_name || '',
    emergency_contact_phone: (profile as any)?.emergency_contact_phone || '',
    emergency_contact_relationship: (profile as any)?.emergency_contact_relationship || '',

    urls: {
      instagram: (user?.urls as any)?.instagram || '',
      tiktok: (user?.urls as any)?.tiktok || '',
    },
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Hydrate form
  React.useEffect(() => {
    if (profile || user) {
      form.reset({
        ...defaultValues,
        bio: (profile as any)?.bio || user?.bio || '',
        emergency_contact_name: (profile as any)?.emergency_contact_name || '',
        emergency_contact_phone: (profile as any)?.emergency_contact_phone || '',
        emergency_contact_relationship: (profile as any)?.emergency_contact_relationship || '',
      });
    }
  }, [profile, user]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large', { description: 'Image must be smaller than 2MB' });
      return;
    }

    setIsUploading(true);
    try {
      if (uploadPhoto) {
          await uploadPhoto(file);
          setAvatarKey(Date.now());
          toast.success('Photo updated', { description: 'Profile picture changed successfully.' });
          router.refresh();
      }
    } catch (error) {
        toast.error('Upload failed', { description: 'Could not upload profile picture.' });
    } finally {
      setIsUploading(false);
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    try {
      if (updateProfile) {
        await updateProfile(data);
        toast.success('Settings Saved', {
            description: 'Your private profile settings have been updated.',
            icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
        });
        router.refresh();
      }
    } catch (error) {
      toast.error('Update Failed', {
        description: 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div className="flex items-center gap-4 border-b pb-6">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/student/profile">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information and security details.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Visible to roommates and landlords.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-muted">
                <AvatarImage src={user?.profile_picture || user?.avatar ? `${user.profile_picture || user.avatar}?t=${avatarKey}` : undefined} />
                <AvatarFallback className="text-2xl">
                  {user?.first_name?.[0]}
                  {user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <div className="flex gap-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="avatar-upload"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    Change Picture
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, GIF or PNG. Max size of 2MB.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Basic contact details for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-muted" />
                      </FormControl>
                      <FormDescription>
                        Contact support to change your email.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little bit about yourself"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

           {/* Emergency Contact - Private Section */}
           <Card className="border-l-4 border-l-rose-500 shadow-sm">
            <CardHeader className="bg-rose-50/50 dark:bg-rose-950/10">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900/30">
                    <ShieldCheck className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                 </div>
                 <div>
                    <CardTitle className="text-lg">Emergency Contact</CardTitle>
                    <CardDescription className="text-rose-700/80 dark:text-rose-400/80">
                        <Lock className="h-3 w-3 inline mr-1" />
                        Private & Confidential. Only used for emergencies.
                    </CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Parent/Guardian Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mother, Father, Friend" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Phone Number</FormLabel>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="+254 7..." className="pl-9" {...field} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4 py-4 sticky bottom-0 bg-background/95 backdrop-blur z-10 p-4 border-t mt-8 shadow-lg rounded-lg">
             <Button variant="outline" asChild type="button">
              <Link href="/student/profile">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 min-w-[200px] shadow-emerald-500/20 shadow-lg">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
