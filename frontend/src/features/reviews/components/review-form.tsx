// src/components/reviews/review-form.tsx
'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewSchema } from '@/lib/validations/review.schema';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RatingInput } from './rating-input';
import { useMutation } from '@tanstack/react-query';
import { createReview } from '@/features/reviews';
import { toast } from 'sonner';
import type { ReviewFormData } from '@/types/forms.types';

interface ReviewFormProps {
  hostelId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ hostelId, onSuccess }: ReviewFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '', hostelId },
  });

  const rating = useWatch({ control, name: 'rating' });

  const mutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      toast.success('Review submitted!');
      onSuccess?.();
    },
    onError: () => toast.error('Failed to submit review'),
  });

  const onSubmit = (data: ReviewFormData) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <RatingInput
          value={rating || 0}
          onChange={(r) => setValue('rating', r)}
        />
        {errors.rating && (
          <p className="text-red-500">{errors.rating.message}</p>
        )}
      </div>
      <Textarea {...register('comment')} placeholder="Write your review..." />
      {errors.comment && (
        <p className="text-red-500">{errors.comment.message}</p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        Submit Review
      </Button>
    </form>
  );
}
