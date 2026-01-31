'use client';

import { useCompleteGoogleLogin } from '../hooks/use-auth';
import { AuthCard } from './auth-card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Building, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface GoogleRoleSelectionProps {
  userInfo: {
    email: string;
    name: string;
    picture: string;
  };
  accessToken: string;
  onBack: () => void;
}

export function GoogleRoleSelection({ userInfo, accessToken, onBack }: GoogleRoleSelectionProps) {
  const { mutate: completeGoogleLogin, isPending } = useCompleteGoogleLogin();

  const handleRoleSelect = (role: 'student' | 'landlord') => {
    completeGoogleLogin({ token: accessToken, role });
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
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Select your identity to finish registration</p>
          </div>
        }
      >
        <div className="grid gabp-4 sm:grid-cols-2 mt-4">
          <button
            onClick={() => handleRoleSelect('student')}
            disabled={isPending}
            className={cn(
               "flex flex-col items-start p-6 border-2 border-gray-100 bg-white transition-all group hover:border-primary hover:bg-primary/5 rounded-none text-left",
               isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="mb-6 p-3 border-2 border-gray-100 bg-gray-50 text-gray-500 group-hover:border-primary/30 group-hover:text-primary transition-colors">
               <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="font-black text-xl mb-1 tracking-tight text-gray-900 group-hover:text-primary transition-colors">Student</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter leading-tight">Find & Book verified hostels</p>
          </button>

          <button
            onClick={() => handleRoleSelect('landlord')}
            disabled={isPending}
            className={cn(
               "flex flex-col items-start p-6 border-2 border-gray-100 bg-white transition-all group hover:border-primary hover:bg-primary/5 rounded-none text-left",
               isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="mb-6 p-3 border-2 border-gray-100 bg-gray-50 text-gray-500 group-hover:border-primary/30 group-hover:text-primary transition-colors">
               <Building className="h-6 w-6" />
            </div>
            <h3 className="font-black text-xl mb-1 tracking-tight text-gray-900 group-hover:text-primary transition-colors">Landlord</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter leading-tight">Manage your property & tenants</p>
          </button>
        </div>

        <div className="pt-6 border-t-2 border-primary/10 flex flex-col items-center gap-4">
          <Button
            variant="ghost"
            className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-primary transition-colors"
            onClick={onBack}
            disabled={isPending}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Different Account
          </Button>

          {isPending && (
            <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-widest animate-pulse">
               <span className="w-2 h-2 bg-primary rounded-none" />
               Initializing Account...
            </div>
          )}
        </div>
      </AuthCard>
    </div>
  );
}
