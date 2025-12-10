'use client';

// guessed new-review page wiring - hostel lookup and submission endpoint may change

import * as React from 'react';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import RatingInput from '@/components/reviews/rating-input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useHostel } from '@/hooks/use-hostel';
import { useCreateReview } from '@/hooks/use-reviews';

export default function Page() {
  const params = useParams<{ hostelId: string }>();
  const hostelId = params.hostelId;
  const { data: hostel, isLoading } = useHostel(hostelId);
  const createReview = useCreateReview();

  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rating || !comment.trim() || !hostelId) return;
    await createReview.mutateAsync({ hostelId, rating, comment });
    setSubmitted(true);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Write a review
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your experience to help other students choose the right hostel.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            {isLoading
              ? 'Selected hostel'
              : (hostel?.name ?? 'Selected hostel')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-medium text-foreground mb-1">
                Overall rating
              </p>
              <RatingInput value={rating} onChange={setRating} />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Comment</p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like about this hostel? What could be improved?"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-[11px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={
                  !rating ||
                  !comment.trim() ||
                  createReview.isPending ||
                  submitted
                }
              >
                {createReview.isPending ? (
                  <span className="flex items-center gap-1">
                    <LoadingSpinner className="h-3 w-3 text-white" />{' '}
                    Submitting…
                  </span>
                ) : submitted ? (
                  'Submitted'
                ) : (
                  'Submit review'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
