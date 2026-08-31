'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { 
  useOnboardingStatus, 
  useSaveOnboardingDraft, 
  useAdvanceOnboardingStage 
} from '@/features/auth/hooks/use-auth';
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
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LandlordOnboardingWizard } from './landlord-onboarding-wizard';

interface OnboardingFormProps {
  role: 'student' | 'landlord' | 'caretaker' | string;
}

export function OnboardingForm({ role }: OnboardingFormProps) {
  const { finalizeOnboarding, user } = useAuth();
  const { data: onboardingStatus, isLoading: isLoadingStatus } = useOnboardingStatus();
  const saveDraftMutation = useSaveOnboardingDraft();
  const advanceStageMutation = useAdvanceOnboardingStage();
  
  const { toast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Student Form
  const studentForm = useForm<StudentOnboardingFormData>({
    resolver: zodResolver(studentOnboardingSchema) as any,
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
      campus: '',
      high_school: '',
      graduation_year: new Date().getFullYear() + 4,
    },
  });

  // Landlord Form
  const landlordForm = useForm<LandlordOnboardingFormData>({
    resolver: zodResolver(landlordOnboardingSchema) as any,
    defaultValues: {
      company_name: '',
      national_id: '',
      phone_number: user?.phone_number || '',
      bank_name: '',
      bank_account_number: '',
    },
  });

  // Sync draft data to form
  useEffect(() => {
    if (onboardingStatus?.draft_data) {
      if (role === 'student') {
        studentForm.reset({
          ...studentForm.getValues(),
          ...onboardingStatus.draft_data
        });
      } else if (role === 'landlord') {
        landlordForm.reset({
          ...landlordForm.getValues(),
          ...onboardingStatus.draft_data
        });
      }
    }
    
    // Auto-detect step based on status if needed, 
    // but for now we let users start at 1 or use local state
  }, [onboardingStatus, role, studentForm, landlordForm]);

  const handleNextStep = async (fields: string[]) => {
    const form = role === 'student' ? studentForm : landlordForm;
    const isValid = await form.trigger(fields as any);
    
    if (isValid) {
      const data = form.getValues();
      const stepData = fields.reduce((acc, field) => {
        acc[field] = (data as any)[field];
        return acc;
      }, {} as any);

      try {
        await saveDraftMutation.mutateAsync(stepData);
        setCurrentStep(prev => prev + 1);
        
        // Also advance backend stage if reaching specific points
        if (currentStep === 1) {
             await advanceStageMutation.mutateAsync('IDENTITY_DRAFT');
        }
      } catch (error) {
        toast({
          title: "Progress not saved",
          description: "We couldn't save your draft, but you can still continue.",
          variant: "destructive"
        });
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const onFinalSubmit = async () => {
    setIsFinalizing(true);
    try {
      await finalizeOnboarding();
      
      toast({
        title: "Registration Complete",
        description: "Your profile has been finalized successfully.",
        variant: "default",
      });
      
      router.push(role === 'student' ? '/tenant/rental' : '/landlord/rental');
    } catch (error: any) {
      toast({
        title: "Finalization Failed",
        description: error.message || "Could not complete onboarding.",
        variant: "destructive",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-bold uppercase tracking-widest text-muted-foreground text-xs mt-4">Initializing Session...</p>
      </div>
    );
  }

  if (role === 'student') {
    return (
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`h-10 w-10 flex items-center justify-center font-black border-2 transition-all ${currentStep >= s ? 'bg-primary border-primary text-white' : 'border-gray-200 text-gray-300'}`}>
                {currentStep > s ? <CheckCircle2 className="h-6 w-6" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-16 mx-2 ${currentStep > s ? 'bg-primary' : 'bg-gray-100'}`} />}
            </div>
          ))}
        </div>

        <Form {...studentForm}>
          <form className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-black text-2xl uppercase tracking-tighter border-b-4 border-primary pb-2">Academic Info</h3>
                <FormField
                  control={studentForm.control}
                  name="university"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold uppercase text-xs text-gray-500">University</FormLabel>
                      <FormControl><Input {...field} className="rounded-none border-2 h-14" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={studentForm.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold uppercase text-xs text-gray-500">Course</FormLabel>
                      <FormControl><Input {...field} className="rounded-none border-2 h-14" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={studentForm.control}
                    name="student_id_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs text-gray-500">Student ID</FormLabel>
                        <FormControl><Input {...field} className="rounded-none border-2 h-14" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="year_of_study"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs text-gray-500">Year</FormLabel>
                        <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={field.value?.toString()}>
                          <FormControl><SelectTrigger className="rounded-none border-2 h-14"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {[1,2,3,4,5,6].map(y => <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={studentForm.control}
                  name="campus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold uppercase text-xs text-gray-500">Campus (Optional)</FormLabel>
                      <FormControl><Input {...field} className="rounded-none border-2 h-14" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={studentForm.control}
                    name="high_school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs text-gray-500">High School (Optional)</FormLabel>
                        <FormControl><Input {...field} className="rounded-none border-2 h-14" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="graduation_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs text-gray-500">Grad Year</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="rounded-none border-2 h-14" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={() => handleNextStep(['university', 'course', 'student_id_number', 'year_of_study', 'campus', 'high_school', 'graduation_year'])} 
                  className="w-full h-16 rounded-none font-black text-lg uppercase tracking-widest mt-4"
                >
                  Next Step <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-black text-2xl uppercase tracking-tighter border-b-4 border-primary pb-2">Personal Details</h3>
                <FormField
                  control={studentForm.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold uppercase text-xs text-gray-500">Phone</FormLabel>
                      <FormControl><Input {...field} className="rounded-none border-2 h-14" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={studentForm.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold uppercase text-xs text-gray-500">DOB</FormLabel>
                      <FormControl>
                        <Input 
                            type="date" 
                            {...field} 
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.valueAsDate)}
                            className="rounded-none border-2 h-14" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1 h-16 rounded-none border-2 font-bold uppercase"><ArrowLeft className="mr-2" /> Back</Button>
                  <Button type="button" onClick={() => handleNextStep(['phone_number', 'date_of_birth'])} className="flex-[2] h-16 rounded-none font-black uppercase">Continue <ArrowRight className="ml-2" /></Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-black text-2xl uppercase tracking-tighter border-b-4 border-primary pb-2">Emergency Contact</h3>
                <FormField
                  control={studentForm.control}
                  name="emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold uppercase text-xs text-gray-500">Contact Name</FormLabel>
                      <FormControl><Input {...field} className="rounded-none border-2 h-14" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={studentForm.control}
                    name="emergency_contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs text-gray-500">Contact Phone</FormLabel>
                        <FormControl><Input {...field} className="rounded-none border-2 h-14" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="emergency_contact_relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs text-gray-500">Relationship</FormLabel>
                        <FormControl><Input {...field} className="rounded-none border-2 h-14" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1 h-16 rounded-none border-2 font-bold uppercase">Back</Button>
                  <Button 
                    type="button" 
                    onClick={onFinalSubmit} 
                    className="flex-[2] h-16 rounded-none font-black uppercase text-xl bg-green-600 hover:bg-green-700"
                    disabled={isFinalizing}
                  >
                    {isFinalizing ? <Loader2 className="animate-spin" /> : "Finish & Explore"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    );
  }

  if (role === 'landlord') {
    return <LandlordOnboardingWizard />;
  }

  return <div>Unknown Role</div>;
}
