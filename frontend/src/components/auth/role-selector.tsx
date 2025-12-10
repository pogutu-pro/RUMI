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
    title: 'Student',
    description: 'Find verified hostels, manage bookings, and pay securely.',
  },
  {
    value: 'landlord',
    title: 'Landlord',
    description: 'List hostels, manage tenants, and track earnings.',
  },
];

interface RoleSelectorProps {
  value: AuthRole;
  onValueChange: (role: AuthRole) => void;
  disabled?: boolean;
}

export function RoleSelector({
  value,
  onValueChange,
  disabled,
}: RoleSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ROLE_OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onValueChange(option.value)}
            disabled={disabled}
            className={cn(
              'rounded-2xl border p-4 text-left transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              'disabled:cursor-not-allowed disabled:opacity-60',
              isActive
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50',
            )}
          >
            <p className="font-semibold">{option.title}</p>
            <p className="mt-1 text-sm text-gray-600">{option.description}</p>
          </button>
        );
      })}
    </div>
  );
}

