'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';

type ReviewFormData = {
  rating: number;
  cleanliness: number;
  facilities: number;
  location: number;
  value: number;
  title: string;
  comment: string;
};

export default function WriteReviewPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [ratings, setRatings] = React.useState({
    overall: 0,
    cleanliness: 0,
    facilities: 0,
    location: 0,
    value: 0,
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ReviewFormData>();

  const RatingInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="space-y-2">
      <Label className="text-foreground">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= value
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{value}/5</span>
      </div>
    </div>
  );

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      const reviewData = {
        ...data,
        ...ratings,
      };
      // TODO: API call to submit review
      console.log('Submitting review:', reviewData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/student/reviews');
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/student/reviews">
          <Button variant="ghost" size="sm" className="dark:border-gray-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Write a Review
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share your experience with future students
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Rate Your Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Ratings */}
            <div className="space-y-4">
              <RatingInput
                label="Overall Rating *"
                value={ratings.overall}
                onChange={(v) => {
                  setRatings({ ...ratings, overall: v });
                  setValue('rating', v);
                }}
              />
              <RatingInput
                label="Cleanliness"
                value={ratings.cleanliness}
                onChange={(v) => {
                  setRatings({ ...ratings, cleanliness: v });
                  setValue('cleanliness', v);
                }}
              />
              <RatingInput
                label="Facilities"
                value={ratings.facilities}
                onChange={(v) => {
                  setRatings({ ...ratings, facilities: v });
                  setValue('facilities', v);
                }}
              />
              <RatingInput
                label="Location"
                value={ratings.location}
                onChange={(v) => {
                  setRatings({ ...ratings, location: v });
                  setValue('location', v);
                }}
              />
              <RatingInput
                label="Value for Money"
                value={ratings.value}
                onChange={(v) => {
                  setRatings({ ...ratings, value: v });
                  setValue('value', v);
                }}
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">
                Review Title *
              </Label>
              <Input
                id="title"
                placeholder="Summarize your experience in one line"
                className="bg-background"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.title.message}</p>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-foreground">
                Your Review *
              </Label>
              <Textarea
                id="comment"
                placeholder="Tell future students about your experience..."
                rows={6}
                className="bg-background"
                {...register('comment', { required: 'Review comment is required' })}
              />
              {errors.comment && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.comment.message}</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || ratings.overall === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Link href="/student/reviews">
                <Button type="button" variant="outline" className="dark:border-gray-700">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
