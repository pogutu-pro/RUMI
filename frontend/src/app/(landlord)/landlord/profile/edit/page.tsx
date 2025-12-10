'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Upload, 
  Trash2, 
  ArrowLeft,
  Save,
  Briefcase,
  DollarSign,
  Building2,
  FileText,
  CreditCard
} from 'lucide-react';
import { getUserInitials } from '@/lib/utils/user';
import Link from 'next/link';

// Validation schemas
const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
});

const businessDetailsSchema = z.object({
  companyName: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  taxPin: z.string().optional(),
  numberOfProperties: z.coerce.number().min(0).default(0),
  businessAddress: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const bankingInfoSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required').optional(),
  accountNumber: z.string().min(5, 'Invalid account number').optional(),
  accountName: z.string().min(1, 'Account name is required').optional(),
  branchCode: z.string().optional(),
  swiftCode: z.string().optional(),
  mpesaPaybill: z.string().optional(),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;
type BusinessDetailsFormValues = z.infer<typeof businessDetailsSchema>;
type BankingInfoFormValues = z.infer<typeof bankingInfoSchema>;

const kenyanBanks = [
  'Equity Bank',
  'KCB Bank',
  'Cooperative Bank',
  'NCBA Bank',
  'Stanbic Bank',
  'Standard Chartered',
  'Absa Bank Kenya',
  'DTB Bank',
  'I&M Bank',
  'Family Bank',
  'Sidian Bank',
  'Guardian Bank',
  'ABC Bank',
  'Prime Bank',
  'Other'
];

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('personal');
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const displayName = React.useMemo(() => {
    if (!user) return 'Landlord';
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(' ');
    }
    return user.email?.split('@')[0] || 'Landlord';
  }, [user]);

  const initials = React.useMemo(() => {
    return displayName ? getUserInitials(displayName) : 'LL';
  }, [displayName]);

  // Personal Info Form
  const personalInfoForm = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phoneNumber || user?.phone || '',
      bio: '',
    },
  });

  // Business Details Form
  const businessDetailsForm = useForm<BusinessDetailsFormValues>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: {
      companyName: '',
      businessRegistrationNumber: '',
      taxPin: '',
      numberOfProperties: 0,
      businessAddress: '',
      website: '',
    },
  });

  // Banking Info Form
  const bankingInfoForm = useForm<BankingInfoFormValues>({
    resolver: zodResolver(bankingInfoSchema),
    defaultValues: {
      bankName: '',
      accountNumber: '',
      accountName: '',
      branchCode: '',
      swiftCode: '',
      mpesaPaybill: '',
    },
  });

  // Handle avatar selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or WebP image',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // TODO: Upload to server
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: 'Avatar uploaded',
        description: 'Your profile photo has been updated successfully',
      });
    }, 1500);
  };

  // Handle avatar removal
  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Avatar removed',
      description: 'Your profile photo has been removed',
    });
  };

  // Submit handlers
  const onSubmitPersonalInfo = async (data: PersonalInfoFormValues) => {
    try {
      // TODO: Call API to update profile
      console.log('Personal Info:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Profile updated',
        description: 'Your personal information has been saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmitBusinessDetails = async (data: BusinessDetailsFormValues) => {
    try {
      console.log('Business Details:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Business details updated',
        description: 'Your business information has been saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update business details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmitBankingInfo = async (data: BankingInfoFormValues) => {
    try {
      console.log('Banking Info:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Banking information updated',
        description: 'Your payment details have been saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update banking information. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/landlord/profile">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
          <p className="text-muted-foreground mt-1">
            Update your personal information and business details
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Personal Info</span>
            <span className="sm:hidden">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Business</span>
            <span className="sm:hidden">Business</span>
          </TabsTrigger>
          <TabsTrigger value="banking" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Banking</span>
            <span className="sm:hidden">Banking</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-6">
          {/* Avatar Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>Upload a professional photo for your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-background ring-4 ring-emerald-100 dark:ring-emerald-900/50">
                  <AvatarImage src={avatarPreview || user?.avatar || user?.profileImage} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-blue-500 text-white text-3xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                  {(avatarPreview || user?.avatar || user?.profileImage) && (
                    <Button
                      variant="outline"
                      onClick={handleRemoveAvatar}
                      disabled={isUploading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                JPG, PNG or WebP. Max size 5MB. Recommended size 400x400px.
              </p>
            </CardContent>
          </Card>

          {/* Personal Information Form */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your name and contact details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...personalInfoForm}>
                <form onSubmit={personalInfoForm.handleSubmit(onSubmitPersonalInfo)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={personalInfoForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalInfoForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={personalInfoForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} disabled />
                        </FormControl>
                        <FormDescription>
                          Email cannot be changed. Contact support if needed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalInfoForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+254712345678" {...field} />
                        </FormControl>
                        <FormDescription>
                          Include country code (e.g., +254 for Kenya)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalInfoForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell tenants about yourself and your approach to property management..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/1000 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button type="submit" disabled={personalInfoForm.formState.isSubmitting}>
                      <Save className="h-4 w-4 mr-2" />
                      {personalInfoForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => personalInfoForm.reset()}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Details Tab */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>Company and tax registration details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...businessDetailsForm}>
                <form onSubmit={businessDetailsForm.handleSubmit(onSubmitBusinessDetails)} className="space-y-4">
                  <FormField
                    control={businessDetailsForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company / Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Properties Ltd" {...field} />
                        </FormControl>
                        <FormDescription>Optional - for business accounts</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={businessDetailsForm.control}
                      name="businessRegistrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Registration Number</FormLabel>
                          <FormControl>
                            <Input placeholder="PVT-XXXXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={businessDetailsForm.control}
                      name="taxPin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>KRA Tax PIN</FormLabel>
                          <FormControl>
                            <Input placeholder="A123456789X" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={businessDetailsForm.control}
                    name="numberOfProperties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Properties</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Total properties you manage or own
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessDetailsForm.control}
                    name="businessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="123 Main Street, Nairobi"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessDetailsForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormDescription>Optional - your business website</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button type="submit" disabled={businessDetailsForm.formState.isSubmitting}>
                      <Save className="h-4 w-4 mr-2" />
                      {businessDetailsForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => businessDetailsForm.reset()}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banking Info Tab */}
        <TabsContent value="banking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Banking Information
              </CardTitle>
              <CardDescription>Payment and payout details for rent collection</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...bankingInfoForm}>
                <form onSubmit={bankingInfoForm.handleSubmit(onSubmitBankingInfo)} className="space-y-4">
                  <FormField
                    control={bankingInfoForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="">Select a bank</option>
                            {kenyanBanks.map((bank) => (
                              <option key={bank} value={bank}>
                                {bank}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={bankingInfoForm.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankingInfoForm.control}
                      name="accountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={bankingInfoForm.control}
                      name="branchCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch Code</FormLabel>
                          <FormControl>
                            <Input placeholder="001" {...field} />
                          </FormControl>
                          <FormDescription>Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankingInfoForm.control}
                      name="swiftCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SWIFT Code</FormLabel>
                          <FormControl>
                            <Input placeholder="KCBLKENX" {...field} />
                          </FormControl>
                          <FormDescription>For international transfers</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={bankingInfoForm.control}
                    name="mpesaPaybill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>M-PESA Paybill Number</FormLabel>
                        <FormControl>
                          <Input placeholder="123456" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional - your M-PESA paybill for rent payments
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button type="submit" disabled={bankingInfoForm.formState.isSubmitting}>
                      <Save className="h-4 w-4 mr-2" />
                      {bankingInfoForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => bankingInfoForm.reset()}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Security Note */}
          <div className="flex gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-500">
                Secure Banking Information
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-600">
                Your banking details are encrypted and securely stored. They are only used for processing rental payments and will never be shared with third parties.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
