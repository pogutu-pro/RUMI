'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCompleteGoogleLogin } from '../hooks/use-auth';
import { AuthCard } from './auth-card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Building, ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { googleCompleteSchema, type GoogleCompleteFormData } from '@/lib/validations/auth.schema';
import { FormField } from '@/components/ui/form-fields';
import { useQuery } from '@tanstack/react-query';
import { hostelsApi } from '@/features/hostels/api/hostels';
import { DynamicDatePicker } from '@/components/ui/dynamic-date-picker';
import { Controller } from 'react-hook-form';

interface GoogleRoleSelectionProps {
  userInfo: {
    email: string;
    name: string;
    picture: string;
  };
  accessToken: string;
  initialRole?: 'student' | 'landlord' | null;
  onBack: () => void;
}

export function GoogleRoleSelection({ userInfo, accessToken, initialRole, onBack }: GoogleRoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'student' | 'landlord' | null>(initialRole || null);
  const { mutate: completeGoogleLogin, isPending } = useCompleteGoogleLogin();

  const { data: hostelsData } = useQuery({
    queryKey: ['hostels_list_minimal'],
    queryFn: () => hostelsApi.getHostels({ per_page: 100 }),
    enabled: selectedRole === 'student'
  });
  const hostels = hostelsData?.results || [];

  const form = useForm<GoogleCompleteFormData>({
    // @ts-ignore - Resolver type mismatch with preferred_hostel_id inference
    resolver: zodResolver(googleCompleteSchema),
    defaultValues: {
      role: initialRole || 'student',
      gender: 'male' as const,
      date_of_birth: '',
      phone_number: '',
      university: '',
      preferred_hostel_id: undefined,
      room_number: '',
      company_name: '',
      total_units: 0,
    } as GoogleCompleteFormData,
  });

  const onSubmit: SubmitHandler<GoogleCompleteFormData> = (data) => {
    const { date_of_birth, ...rest } = data;
    completeGoogleLogin({ 
      token: accessToken, 
      ...rest,
      date_of_birth: date_of_birth instanceof Date 
        ? date_of_birth.toISOString().split('T')[0] 
        : date_of_birth
    });
  };

  const handleRoleClick = (role: 'student' | 'landlord') => {
    setSelectedRole(role);
    form.setValue('role', role);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <AuthCard
        icon={
          <div className="w-16 h-16 border-2 border-primary overflow-hidden rounded-none">
            <img 
              src={userInfo.picture} 
              alt={userInfo.name}
              className="w-full h-full object-cover transition-all"
            />
          </div>
        }
        title={<span className="font-black text-2xl tracking-tight uppercase">Welcome, {userInfo.name.split(' ')[0]}</span>}
        description={
          <div className="space-y-1">
            <p className="text-gray-900 font-bold">{userInfo.email}</p>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              {selectedRole ? 'Complete your identity' : 'Select your identity to finish registration'}
            </p>
          </div>
        }
      >
        {!selectedRole ? (
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <button
              onClick={() => handleRoleClick('student')}
              className="flex flex-col items-start p-6 border-2 border-gray-100 bg-white transition-all group hover:border-primary hover:bg-primary/5 rounded-none text-left"
            >
              <div className="mb-6 p-3 border-2 border-gray-100 bg-gray-50 text-gray-500 group-hover:border-primary/30 group-hover:text-primary transition-colors">
                 <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="font-black text-xl mb-1 tracking-tight text-gray-900 group-hover:text-primary transition-colors">Student</h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter leading-tight">Find & Book verified hostels</p>
            </button>

            <button
              onClick={() => handleRoleClick('landlord')}
              className="flex flex-col items-start p-6 border-2 border-gray-100 bg-white transition-all group hover:border-primary hover:bg-primary/5 rounded-none text-left"
            >
              <div className="mb-6 p-3 border-2 border-gray-100 bg-gray-50 text-gray-500 group-hover:border-primary/30 group-hover:text-primary transition-colors">
                 <Building className="h-6 w-6" />
              </div>
              <h3 className="font-black text-xl mb-1 tracking-tight text-gray-900 group-hover:text-primary transition-colors">Landlord</h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter leading-tight">Manage your property & tenants</p>
            </button>
          </div>
        ) : (
          // @ts-ignore - SubmitHandler type mismatch with FieldValues constraint
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-primary/5 border-l-4 border-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedRole === 'student' ? <GraduationCap className="h-5 w-5 text-primary" /> : <Building className="h-5 w-5 text-primary" />}
                <span className="font-black uppercase tracking-widest text-sm">{selectedRole} Account</span>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="text-[10px] uppercase font-black tracking-tighter"
                onClick={() => setSelectedRole(null)}
              >
                Change Role
              </Button>
            </div>

            {/* Common error display */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="p-3 bg-destructive/10 border-l-4 border-destructive text-destructive text-xs font-bold uppercase tracking-wide">
                Please fix the errors below to continue.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+2547XXXXXXXX"
                {...form.register('phone_number')}
                className="flex h-11 w-full rounded-none border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors font-bold"
              />
              {form.formState.errors.phone_number && (
                <p className="text-[10px] text-destructive font-bold uppercase">{form.formState.errors.phone_number.message}</p>
              )}
            </div>

            {selectedRole === 'student' ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-1">Gender</label>
                    <select
                      {...form.register('gender')}
                      className="flex h-14 w-full rounded-none border-2 border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all font-black"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2 uppercase">
                    <label className="text-[10px] font-black tracking-widest text-muted-foreground px-1">Date of Birth</label>
                    <Controller
                      control={form.control}
                      name="date_of_birth"
                      render={({ field }) => (
                        <DynamicDatePicker
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                        />
                      )}
                    />
                    {form.formState.errors.date_of_birth && (
                      <p className="text-[10px] text-destructive font-bold uppercase">{form.formState.errors.date_of_birth.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-1">University</label>
                  <input
                    placeholder="University of Nairobi"
                    {...form.register('university')}
                    className="flex h-11 w-full rounded-none border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors font-bold"
                  />
                  {form.formState.errors.university && (
                    <p className="text-[10px] text-destructive font-bold uppercase">{form.formState.errors.university.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-1">Preferred Hostel</label>
                  <select
                    {...form.register('preferred_hostel_id')}
                    className="flex h-14 w-full rounded-none border-2 border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all font-black"
                  >
                    <option value="">I haven't picked one</option>
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-1">Property Name (Company)</label>
                  <input
                    placeholder="RUMI Apartments"
                    {...form.register('company_name')}
                    className="flex h-11 w-full rounded-none border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors font-bold"
                  />
                  {form.formState.errors.company_name && (
                    <p className="text-[10px] text-destructive font-bold uppercase">{form.formState.errors.company_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-1">Number of Units</label>
                  <input
                    type="number"
                    placeholder="10"
                    {...form.register('total_units')}
                    className="flex h-11 w-full rounded-none border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors font-bold"
                  />
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  FINISHING UP...
                </>
              ) : (
                'COMPLETE REGISTRATION'
              )}
            </Button>
          </form>
        )}

        <div className="pt-6 border-t-2 border-primary/10 flex flex-col items-center gap-4 mt-6">
          <Button
            variant="ghost"
            className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-primary transition-colors"
            onClick={onBack}
            disabled={isPending}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Different Account
          </Button>
        </div>
      </AuthCard>
    </div>
  );
}
