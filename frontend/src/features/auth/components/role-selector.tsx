'use client';

import type { UserRole } from '@/types/auth.types';
import { cn } from '@/lib/utils/cn';
import { Home, Building2, CheckCircle2 } from 'lucide-react';

type AuthRole = Extract<UserRole, 'student' | 'landlord'>;

const ROLE_OPTIONS: Array<{
  value: AuthRole;
  title: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    value: 'student',
    title: 'Tenant',
    description: 'See your unit and rent, track your balance, and pay via Paystack.',
    icon: Home,
  },
  {
    value: 'landlord',
    title: 'Landlord / Agent',
    description: 'Manage your properties, track tenants, and collect rent.',
    icon: Building2,
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
              'relative rounded-3xl border p-6 text-left transition-all group overflow-hidden',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'disabled:cursor-not-allowed disabled:opacity-60',
              isActive
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-100 shadow-sm hover:shadow-md hover:border-primary/30 hover:bg-gray-50',
            )}
          >
            {isActive && (
              <div className="absolute top-0 right-0 p-3 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            )}

            <div className={cn(
              "mb-6 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
              isActive ? "bg-primary text-white" : "bg-gray-50 text-gray-500 group-hover:text-primary"
            )}>
              <Icon className="h-6 w-6" />
            </div>

            <h3 className={cn(
              "font-bold text-xl mb-2 tracking-tight transition-colors",
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
          </button>
        );
      })}
      </div>
    </div>
  );
}

