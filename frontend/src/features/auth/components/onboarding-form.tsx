'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { 
  studentOnboardingSchema, 
  landlordOnboardingSchema,
  type StudentOnboardingFormData,
  type LandlordOnboardingFormData 
} from '@/lib/validations/auth.schema';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface OnboardingFormProps {
  role: 'student' | 'landlord' | 'caretaker' | string;
}

export function OnboardingForm({ role }: OnboardingFormProps) {
  const { updateProfile, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student Form
  const studentForm = useForm<StudentOnboardingFormData>({
    resolver: zodResolver(studentOnboardingSchema),
    defaultValues: {
      university: '',
      student_id_number: '',
      course: '',
      year_of_study: 1,
      phone_number: user?.phone_number || '',
      date_of_birth: new Date(),
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',
    },
  });

  // Landlord Form
  const landlordForm = useForm<LandlordOnboardingFormData>({
    resolver: zodResolver(landlordOnboardingSchema),
    defaultValues: {
      company_name: '',
      national_id: '',
      phone_number: user?.phone_number || '',
      bank_name: '',
      bank_account_number: '',
    },
  });

  const onStudentSubmit = async (data: StudentOnboardingFormData) => {
    setIsSubmitting(true);
    try {
      // Format date to YYYY-MM-DD string for backend
      const formattedData = {
        ...data,
        role: 'student', // Context for updateProfile
      };
      
      await updateProfile(formattedData);
      
      toast({
        title: "Profile Complete",
        description: "Welcome to Rumi! Your profile has been set up.",
        variant: "default",
      });
      
      router.push('/student/dashboard');
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Could not save profile details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLandlordSubmit = async (data: LandlordOnboardingFormData) => {
    setIsSubmitting(true);
    try {
      await updateProfile({
        ...data,
        role: 'landlord', // Context
      });

      toast({
        title: "Profile Under Review",
        description: "Your details have been submitted for verification.",
        variant: "default",
      });

      router.push('/landlord/dashboard');
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Could not save profile details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (role === 'student') {
    return (
      <Form {...studentForm}>
        <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-6 animate-in fade-in duration-500">
          <div className="space-y-4">
            <h3 className="font-black text-xl uppercase tracking-tight border-b-2 border-gray-100 pb-2">Academic Info</h3>
            
            <FormField
              control={studentForm.control}
              name="university"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase text-xs text-gray-500 tracking-wider">University / College</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Strathmore University" className="rounded-none border-2 h-12 font-medium focus:border-primary focus:ring-0" />
                  </FormControl>
                  <FormMessage className="font-bold" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={studentForm.control}
                name="student_id_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold uppercase text-xs text-gray-500 tracking-wider">Student ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. 12345/2023" className="rounded-none border-2 h-12 font-medium focus:border-primary focus:ring-0" />
                    </FormControl>
                    <FormMessage className="font-bold" />
                  </FormItem>
                )}
              />

              <FormField
                control={studentForm.control}
                name="year_of_study"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold uppercase text-xs text-gray-500 tracking-wider">Year of Study</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={field.value.toString()}>
                      <FormControl className="rounded-none border-2 h-12 font-medium focus:border-primary focus:ring-0">
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none border-2 border-primary">
                        {[1, 2, 3, 4, 5, 6].map((year) => (
                          <SelectItem key={year} value={year.toString()} className="font-bold focus:bg-primary/20 cursor-pointer">
                            Year {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="font-bold" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={studentForm.control}
              name="course"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase text-xs text-gray-500 tracking-wider">Course / Degree</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. BSc. Computer Science" className="rounded-none border-2 h-12 font-medium focus:border-primary focus:ring-0" />
                  </FormControl>
                  <FormMessage className="font-bold" />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 pt-4 border-t-2 border-gray-100">
            <h3 className="font-black text-xl uppercase tracking-tight border-b-2 border-gray-100 pb-2">Personal Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={studentForm.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold uppercase text-xs text-gray-500 tracking-wider">Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+254..." className="rounded-none border-2 h-12 font-medium focus:border-primary focus:ring-0" />
                    </FormControl>
                    <FormMessage className="font-bold" />
                  </FormItem>
                )}
              />

              <FormField
                control={studentForm.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold uppercase text-xs text-gray-500 tracking-wider">Date of Birth</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.valueAsDate)}
                        className="rounded-none border-2 h-12 font-medium focus:border-primary focus:ring-0" 
                      />
                    </FormControl>
                    <FormMessage className="font-bold" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={studentForm.control}
              name="emergency_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase text-xs text-gray-500 tracking-wider">Emergency Contact Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="rounded-none border-2 h-12 font-medium focus:border-primary focus:ring-0" />
                  </FormControl>
                  <FormMessage className="font-bold" />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
               <FormField
                control={studentForm.control}
                name="emergency_contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold uppercase text-xs text-gray-500 tracking-wider">Contact Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+254..." className="rounded-none border-2 h-12 font-medium focus:border-primary focus:ring-0" />
                    </FormControl>
                    <FormMessage className="font-bold" />
                  </FormItem>
                )}
              />
               <FormField
                control={studentForm.control}
                name="emergency_contact_relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold uppercase text-xs text-gray-500 tracking-wider">Relationship</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Parent" className="rounded-none border-2 h-12 font-medium focus:border-primary focus:ring-0" />
                    </FormControl>
                    <FormMessage className="font-bold" />
                  </FormItem>
                )}
              />
             </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-none bg-primary text-white font-black uppercase tracking-widest hover:bg-primary/90 transition-all text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" /> Saving...
              </span>
            ) : "Complete Profile"}
          </Button>
        </form>
      </Form>
    );
  }

  if (role === 'landlord') {
    return (
      <Form {...landlordForm}>
        <form onSubmit={landlordForm.handleSubmit(onLandlordSubmit)} className="space-y-6 animate-in fade-in duration-500">
           <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
            <p className="text-sm text-blue-900 font-bold">
              Verification Required: As a landlord, you must provide your National ID for identity verification before you can list properties.
            </p>
          </div>

          <div className="space-y-4">
             <FormField
              control={landlordForm.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase text-xs text-gray-500 tracking-wider">Property / Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Riverside Apartments" className="rounded-none border-2 h-12 font-medium focus:border-primary focus:ring-0" />
                  </FormControl>
                  <FormMessage className="font-bold" />
                </FormItem>
              )}
            />
            
            <FormField
              control={landlordForm.control}
              name="national_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase text-xs text-gray-500 tracking-wider">National ID Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 12345678" className="rounded-none border-2 h-12 font-medium focus:border-primary focus:ring-0 bg-yellow-50/50" />
                  </FormControl>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wide">For official verification purposes only</p>
                  <FormMessage className="font-bold" />
                </FormItem>
              )}
            />

            <FormField
              control={landlordForm.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase text-xs text-gray-500 tracking-wider">Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+254..." className="rounded-none border-2 h-12 font-medium focus:border-primary focus:ring-0" />
                  </FormControl>
                  <FormMessage className="font-bold" />
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-none bg-primary text-white font-black uppercase tracking-widest hover:bg-primary/90 transition-all text-lg mt-8"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" /> Saving...
              </span>
            ) : "Submit for Verification"}
          </Button>
        </form>
      </Form>
    );
  }

  return <div>Unknown Role</div>;
}
