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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, Upload, ArrowLeft, Save, School, CheckCircle2, ChevronRight, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Schema: Strictly Match-Relevant Data
const matchProfileSchema = z.object({
  // Bio & Identity
  first_name: z.string().min(2, 'Required'),
  last_name: z.string().min(2, 'Required'),
  bio: z.string().max(500, 'Keep it under 500 chars').optional(),
  
  // social handles
  urls: z.object({
    instagram: z.string().optional().or(z.literal('')),
    tiktok: z.string().optional().or(z.literal('')),
  }).optional(),

  // Academic (The Core Match Criteria)
  university: z.string().min(2, 'University is required'),
  campus: z.string().min(2, 'Campus is required'),
  course: z.string().min(2, 'Course is required'),
  year_of_study: z.coerce.number().min(1).max(7),
  graduation_year: z.coerce.number().min(2020).max(2030),
  student_id_number: z.string().min(1, 'ID Required for verification'),
  high_school: z.string().optional(), 
});

type MatchProfileValues = z.infer<typeof matchProfileSchema>;

export default function MatchProfilePage() {
  const router = useRouter();
  const { user, profile, updateProfile, uploadPhoto } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  // Profile Strength Calculation
  const completionPercentage = (profile as any)?.profile_completion_percentage || 0;
  
  const strengthColor = completionPercentage < 100 ? 'bg-primary/60' : 'bg-primary';

  const defaultValues: Partial<MatchProfileValues> = {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: (profile as any)?.bio || user?.bio || '',
    
    university: (profile as any)?.university || '',
    campus: (profile as any)?.campus || '',
    course: (profile as any)?.course || '',
    year_of_study: (profile as any)?.year_of_study || 1,
    graduation_year: (profile as any)?.graduation_year || 2026,
    student_id_number: (profile as any)?.student_id_number || '',
    high_school: (profile as any)?.high_school || '',

    urls: {
      instagram: (user?.urls as any)?.instagram || '',
      tiktok: (user?.urls as any)?.tiktok || '',
    },
  };

  const form = useForm<MatchProfileValues>({
    resolver: zodResolver(matchProfileSchema),
    defaultValues,
    mode: 'onChange',
  });

  React.useEffect(() => {
    if (profile || user) {
      form.reset({
        ...defaultValues,
        bio: (profile as any)?.bio || user?.bio || '',
        university: (profile as any)?.university || '',
        campus: (profile as any)?.campus || '',
        course: (profile as any)?.course || '',
        year_of_study: (profile as any)?.year_of_study || 1,
        graduation_year: (profile as any)?.graduation_year || 2026,
        student_id_number: (profile as any)?.student_id_number || '',
        high_school: (profile as any)?.high_school || '', 
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
          toast.success('Successfully uploaded', { description: 'Profile photo updated.' });
          router.refresh();
      }
    } catch (error) {
      toast.error('Upload failed', { description: 'Could not upload profile picture.' });
    } finally {
      setIsUploading(false);
    }
  }

  async function onSubmit(data: MatchProfileValues) {
    setIsLoading(true);
    try {
      if (updateProfile) {
        await updateProfile(data);
        toast.success('Profile Updated', {
            description: 'Your matchmaking criteria have been saved.',
            icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
        });
        router.refresh();
      }
    } catch (error) {
      toast.error('Update Failed', { description: 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 px-4 md:px-0">
      
      {/* 1. Header & Profile Strength */}
      <div className="grid gap-6 md:grid-cols-[1fr,300px] items-start border-b border-border/50 pb-8">
        <div>
           <Button variant="ghost" size="sm" asChild className="mb-4 text-muted-foreground w-fit pl-0 hover:bg-transparent hover:text-foreground">
             <Link href="/student/roommates" className="flex items-center gap-1 font-bold">
               <ArrowLeft className="h-4 w-4" /> Back to Hub
             </Link>
           </Button>
           <h1 className="text-3xl font-bold tracking-tight text-foreground">Roommate Preferences</h1>
           <p className="text-muted-foreground mt-2 max-w-xl text-sm font-medium">
             This information is visible to potential roommates to help them understand your background and academic focus.
           </p>
        </div>

        <Card className="bg-muted/30 border border-border/20 shadow-none">
            <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Profile Strength</span>
                    <span className="text-sm font-bold text-foreground">
                        {completionPercentage}%
                    </span>
                </div>
                <Progress value={completionPercentage} className="h-2 mb-3 bg-muted border border-border/10" indicatorClassName={strengthColor} />
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">
                    {completionPercentage < 100 
                        ? "Complete all fields for better visibility" 
                        : "Profile fully optimized for matching"}
                </p>
            </CardContent>
        </Card>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
              
              {/* Left Col: Identity & Character */}
              <div className="space-y-6">
                  {/* Photo Card */}
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="pt-8 flex flex-col items-center text-center">
                        <div className="relative mb-6 group">
                             <Avatar className="h-32 w-32 border-2 border-border/50 shadow-md">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback className="text-4xl bg-muted text-muted-foreground font-bold">{user?.first_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer h-32 w-32"
                                onClick={() => document.getElementById('avatar-upload')?.click()}
                            >
                                <Upload className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <Input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            id="avatar-upload"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg text-foreground">{user?.first_name} {user?.last_name}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Public Profile Photo</p>
                        </div>
                        
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full mt-6 font-bold border-t border-border/50 rounded-none h-11"
                            onClick={(e) => { e.preventDefault(); document.getElementById('avatar-upload')?.click() }}
                        >
                             {isUploading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : "Update Image"}
                        </Button>
                    </CardContent>
                  </Card>

                  {/* Compatibility Assessment Promotion */}
                  <Card className="bg-card border-border/50 shadow-sm">
                      <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base font-bold">
                              <UserCircle className="h-5 w-5 text-primary" />
                              Compatibility
                          </CardTitle>
                          <p className="text-muted-foreground text-xs font-medium">
                              Refine your roommate search by completing our questionnaire.
                          </p>
                      </CardHeader>
                      <CardContent>
                           <Button variant="outline" className="w-full font-bold h-10 border-border/50 hover:bg-muted" type="button" asChild>
                               <Link href="/student/roommates/quiz" className="flex items-center justify-center gap-2">
                                 Take Assessment <ChevronRight className="h-4 w-4" />
                               </Link>
                           </Button>
                      </CardContent>
                  </Card>

                  {/* Social Handles */}
                  <Card className="border-border/50 shadow-sm">
                      <CardHeader className="pb-3 border-b border-border/50 mb-4">
                          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Social Links</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                           <FormField
                                control={form.control}
                                name="urls.instagram"
                                render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-[10px] font-bold text-muted-foreground uppercase opacity-70">IG</span>
                                        <Input placeholder="@username" className="pl-10 font-medium" {...field} />
                                    </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="urls.tiktok"
                                render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-[10px] font-bold text-muted-foreground uppercase opacity-70">TT</span>
                                        <Input placeholder="@username" className="pl-10 font-medium" {...field} />
                                    </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                      </CardContent>
                  </Card>
              </div>

              {/* Right Col: Academic & Bio */}
              <div className="space-y-6">
                 
                 {/* Bio Section */}
                 <Card className="border-border/50 shadow-sm">
                    <CardHeader className="border-b border-border/50 mb-6">
                        <CardTitle className="text-base font-bold">Personal Bio</CardTitle>
                        <CardDescription className="text-xs font-medium">Briefly introduce yourself to prospective roommates.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                <Textarea
                                    placeholder="Briefly describe your lifestyle, interests, and matching preferences..."
                                    className="resize-none min-h-[140px] text-sm"
                                    {...field}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                 </Card>

                 {/* Academic Details - The Core Match Data */}
                 <Card className="border-border/50 shadow-sm">
                    <CardHeader className="border-b border-border/50 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                                <School className="h-5 w-5 text-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold">Academic Verification</CardTitle>
                                <CardDescription className="text-xs font-medium">Verified academic details are essential for accurate matching.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="university"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">University</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger className="font-semibold"><SelectValue placeholder="Select Institution" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="University of Nairobi">University of Nairobi</SelectItem>
                                            <SelectItem value="Kenyatta University">Kenyatta University</SelectItem>
                                            <SelectItem value="JKUAT">JKUAT</SelectItem>
                                            <SelectItem value="Strathmore University">Strathmore University</SelectItem>
                                            <SelectItem value="USIU Africa">USIU Africa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="campus"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Campus Location</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Main Campus" className="font-semibold" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                             <FormField
                                control={form.control}
                                name="course"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Course of Study</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Computer Science" className="font-semibold" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="student_id_number"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Student ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. H31/1234/2022" className="font-semibold" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-3 pt-2">
                             <FormField
                                control={form.control}
                                name="year_of_study"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Academic Year</FormLabel>
                                    <Select 
                                        onValueChange={(val) => field.onChange(parseInt(val))} 
                                        defaultValue={field.value?.toString()}
                                        value={field.value?.toString()}
                                    >
                                        <FormControl>
                                        <SelectTrigger className="font-semibold"><SelectValue placeholder="Year" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6].map(y => <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="graduation_year"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Expected Grad.</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="2026" className="font-semibold" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="high_school"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Previous Institution</FormLabel>
                                    <FormControl>
                                        <Input placeholder="High School (Optional)" className="font-semibold" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                 </Card>
              </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/50 flex justify-end gap-3 z-50 md:static md:bg-transparent md:border-t-0 md:p-0">
             <Button variant="ghost" type="button" onClick={() => router.back()} className="font-bold">Cancel</Button>
             <Button type="submit" disabled={isLoading} className="font-bold min-w-[180px] shadow-sm">
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               <Save className="mr-2 h-4 w-4" />
               Save Changes
             </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
