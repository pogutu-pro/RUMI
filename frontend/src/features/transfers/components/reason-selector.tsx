import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { TransferReason } from '@/types/entities.types';
import { TRANSFER_REASONS } from '@/lib/constants/transfer-rules';

interface ReasonSelectorProps {
  value: TransferReason | null;
  onValueChange: (value: TransferReason) => void;
  reasonDetails?: string;
  onReasonDetailsChange?: (details: string) => void;
  className?: string;
}

export function ReasonSelector({
  value,
  onValueChange,
  reasonDetails,
  onReasonDetailsChange,
  className,
}: ReasonSelectorProps) {
  const reasons = Object.entries(TRANSFER_REASONS) as [TransferReason, typeof TRANSFER_REASONS[TransferReason]][];

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <Label className="text-base font-semibold">
          Why do you want to transfer rooms?
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Select the primary reason for your transfer request
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reasons.map(([key, reason]) => (
          <Card
            key={key}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              value === key
                ? 'border-2 border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/20'
                : 'border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-700'
            )}
            onClick={() => onValueChange(key)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{reason.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">
                    {reason.label}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reason.description}
                  </p>
                </div>
                {value === key && (
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Details for 'Other' or Any Reason */}
      {value && onReasonDetailsChange && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Label htmlFor="reasonDetails">
            Additional Details
            {value === 'other' && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Textarea
            id="reasonDetails"
            placeholder={
              value === 'other'
                ? 'Please provide details about your reason...'
                : 'Any additional information you\'d like to share (optional)'
            }
            value={reasonDetails || ''}
            onChange={(e) => onReasonDetailsChange(e.target.value)}
            rows={4}
            className="resize-none"
          />
          {value === 'other' && reasonDetails && reasonDetails.length < 10 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Please provide at least 10 characters
            </p>
          )}
          {reasonDetails && (
            <p className="text-xs text-muted-foreground text-right">
              {reasonDetails.length} characters
            </p>
          )}
        </div>
      )}
    </div>
  );
}
