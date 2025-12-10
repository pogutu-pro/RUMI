'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { Eye, EyeOff, Check, X } from 'lucide-react';

import {
  getStrengthScore,
  getStrengthLevel,
  getRequirements,
  getStrengthPercentage,
  StrengthLevel,
} from '@/lib/utils/password-utils';

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
  minLength?: number;
}

const levelToColors = (level: StrengthLevel) => {
  switch (level) {
    case 'weak':
      return {
        bar: 'var(--strength-weak, #ef4444)',
        text: 'var(--strength-weak, #ef4444)',
      };
    case 'medium':
      return {
        bar: 'var(--strength-medium, #f59e0b)',
        text: 'var(--strength-medium, #f59e0b)',
      };
    case 'strong':
      return {
        bar: 'var(--strength-strong, #10b981)',
        text: 'var(--strength-strong, #10b981)',
      };
  }
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength = false, minLength, value, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const passwordValue =
      typeof value === 'string' ? value : (value?.toString() ?? '');

    const score = React.useMemo(
      () => (showStrength ? getStrengthScore(passwordValue) : 0),
      [passwordValue, showStrength],
    );

    const level = React.useMemo(() => getStrengthLevel(score), [score]);

    const percentage = React.useMemo(
      () => getStrengthPercentage(score),
      [score],
    );

    const requirements = React.useMemo(
      () => getRequirements(passwordValue, minLength),
      [passwordValue, minLength],
    );

    const colors = levelToColors(level);

    return (
      <div className="space-y-2">
        {/* Input Field */}
        <div className="relative">
          <Input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn('pr-10', className)}
            value={value}
            aria-label={props['aria-label'] ?? 'Password input'}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-pressed={showPassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Strength Meter */}
        {showStrength && passwordValue.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Password strength</span>
              <span
                className="font-medium"
                style={{ color: colors.text }}
                aria-live="polite"
              >
                {level}
              </span>
            </div>

            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colors.bar,
                }}
              />
            </div>

            {/* Requirements */}
            <div className="space-y-1 text-xs">
              {requirements.map((req) => (
                <div
                  key={req.key}
                  className={cn(
                    'flex items-center gap-2 transition-colors',
                    req.met ? 'text-green-600' : 'text-gray-500',
                  )}
                >
                  {req.met ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
