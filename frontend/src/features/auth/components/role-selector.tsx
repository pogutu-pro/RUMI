'use client';

import type { UserRole } from '@/types/auth.types';
import { cn } from '@/lib/utils/cn';
import { GraduationCap, Building, CheckCircle2, UserCog } from 'lucide-react';

type AuthRole = Extract<UserRole, 'student' | 'landlord'>;

const ROLE_OPTIONS: Array<{
  value: AuthRole;
  title: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    value: 'student',
    title: 'Student / Tenant',
    description: 'Find verified hostels, pay rent via M-Pesa, and find roommates.',
    icon: GraduationCap,
  },
  {
    value: 'landlord',
    title: 'Landlord / Manager',
    description: 'List your property, track payments, and manage your tenants.',
    icon: Building,
  },
];

interface RoleSelectorProps {
  value: AuthRole | null;
  onValueChange: (role: AuthRole) => void;
  disabled?: boolean;
}

export function RoleSelector({
  value,
  onValueChange,
  disabled,
}: RoleSelectorProps) {
  return (
    <div className="space-y-4">
      <p className="text-base font-bold text-gray-900 text-center">
        I am registering as:
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
      {ROLE_OPTIONS.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onValueChange(option.value)}
            disabled={disabled}
            className={cn(
              'relative rounded-none border-2 p-6 text-left transition-all group overflow-hidden',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'disabled:cursor-not-allowed disabled:opacity-60',
              isActive
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50',
            )}
          >
            {isActive && (
              <div className="absolute top-0 right-0 p-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            )}
            
            <div className={cn(
              "mb-6 p-3 w-fit border-2 transition-colors",
              isActive ? "border-primary bg-primary text-white" : "border-gray-100 bg-gray-50 text-gray-500 group-hover:border-primary/30 group-hover:text-primary"
            )}>
              <Icon className="h-6 w-6" />
            </div>

            <h3 className={cn(
              "font-black text-xl mb-2 tracking-tight transition-colors",
              isActive ? "text-primary" : "text-gray-900"
            )}>
              {option.title}
            </h3>
            
            <p className={cn(
              "text-sm font-medium leading-relaxed transition-colors",
              isActive ? "text-gray-900" : "text-gray-500"
            )}>
              {option.description}
            </p>

            <div className={cn(
               "mt-4 h-1 w-0 bg-primary transition-all duration-300",
               isActive ? "w-full" : "group-hover:w-12"
            )} />
          </button>
        );
      })}
      </div>
    </div>
  );
}

