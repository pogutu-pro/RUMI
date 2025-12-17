import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateDamageReportPayload } from '@/features/inventory';

const damageReportSchema = z.object({
  bookingId: z.string().min(1, 'Student ID / Booking ID is required'),
  description: z.string().min(3, 'Description is required'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof damageReportSchema>;

export interface DamageReportFormProps {
  onSubmit: (values: CreateDamageReportPayload) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: Error | null;
}

export const DamageReportForm = ({
  onSubmit,
  isSubmitting,
  error,
}: DamageReportFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(damageReportSchema),
  });

  const onFormSubmit = async (data: FormValues) => {
    await onSubmit({
      bookingId: data.bookingId,
      items: [
        {
          description: data.description,
          estimatedCost: 0, 
          inventoryItemId: 'unknown' 
        }
      ],
      notes: data.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5 animate-in fade-in duration-300">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
           <AlertCircle className="h-4 w-4" />
           <p>Failed to submit report. Please try again.</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bookingId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Student / Booking ID
          </Label>
          <Input 
            id="bookingId" 
            placeholder="e.g. BKG-12345" 
            className="h-10"
            {...register('bookingId')} 
          />
          {errors.bookingId && (
            <p className="text-sm text-red-500 font-medium">{errors.bookingId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Description of Damage
          </Label>
          <Textarea 
            id="description" 
            placeholder="Describe what is broken or damaged..." 
            className="min-h-[100px] resize-none"
            {...register('description')} 
          />
          {errors.description && (
            <p className="text-sm text-red-500 font-medium">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Additional Notes <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
          </Label>
          <Textarea 
            id="notes" 
            placeholder="Any extra context (e.g., happened during party)..." 
            className="min-h-[80px]"
            {...register('notes')} 
          />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full font-semibold" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Report...
            </>
          ) : (
            "Submit Damage Report"
          )}
        </Button>
      </div>
    </form>
  );
};
