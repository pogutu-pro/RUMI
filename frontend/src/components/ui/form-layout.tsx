'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils/cn';

/**
 * Standard spacing for a form: consistent vertical rhythm between fields
 * and between sections. Use inside <form>.
 */
export function FormStack({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-5', className)} {...props} />;
}

/**
 * Two fields side by side from `sm` up, stacked on mobile. Short related
 * fields (first/last name, phone/email, rent/deposit) read faster in a row
 * than in one tall column of full-width inputs.
 */
export function FormRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('grid gap-5 sm:grid-cols-2', className)} {...props} />;
}

/** A titled group of fields inside a longer form (e.g. "Next of kin"). */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4 border-t pt-5', className)}>
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/**
 * The action bar every dialog form ends with: a quiet Cancel plus one
 * primary action that shows a spinner while submitting. Replaces the mix of
 * rounded-full / square, sometimes-Cancel-sometimes-not buttons the forms
 * used to build individually.
 */
export function FormDialogActions({
  submitLabel,
  isPending = false,
  disabled = false,
  cancelLabel = 'Cancel',
}: {
  submitLabel: string;
  isPending?: boolean;
  disabled?: boolean;
  cancelLabel?: string;
}) {
  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button type="button" variant="outline" disabled={isPending}>
          {cancelLabel}
        </Button>
      </DialogClose>
      <Button type="submit" isLoading={isPending} disabled={disabled || isPending}>
        {submitLabel}
      </Button>
    </DialogFooter>
  );
}
