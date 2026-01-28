'use client';

import type { UserRole } from '@/types/auth.types';
import { cn } from '@/lib/utils/cn';

type AuthRole = Extract<UserRole, 'student' | 'landlord'>;

const ROLE_OPTIONS: Array<{
  value: AuthRole;
  title: string;
  description: string;
}> = [
  {
    value: 'student',
    title: 'Student / Tenant',
    description: 'Find verified hostels, manage bookings, and find roommates.',
  },
  {
    value: 'landlord',
    title: 'Landlord',
    description: 'List your property, manage units, and track rentals.',
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
      <div className="grid gap-4 sm:grid-cols-2">
      {ROLE_OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onValueChange(option.value)}
            disabled={disabled}
            className={cn(
              'relative rounded-2xl border p-5 text-left transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              'disabled:cursor-not-allowed disabled:opacity-60',
              isActive
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50',
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-lg">{option.title}</p>
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                isActive ? "border-emerald-500" : "border-gray-300"
              )}>
                {isActive && <div className="w-3 h-3 rounded-full bg-emerald-500 animate-in zoom-in-50 duration-300" />}
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{option.description}</p>
          </button>
        );
      })}
      </div>
    </div>
  );
}

