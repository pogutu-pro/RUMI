// Review Store for Hostel Reviews (with backend integration)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as reviewApi from '@/lib/api/reviews';
import type { Review } from '@/types/entities.types';

interface ReviewState {
  reviews: Record<string, Review>;
  fetchReviews: (hostelId: string) => Promise<void>;
  submitReview: (hostelId: string, review: Omit<Review, 'id'>) => Promise<void>;
  editReview: (hostelId: string, review: Partial<Review>) => Promise<void>;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: {},
      async fetchReviews(hostelId) {
        const reviews = await reviewApi.getReviews();
        const found = reviews.find((r) => r.id === hostelId);
        if (found) {
          set((state) => ({
            reviews: {
              ...state.reviews,
              [hostelId]: found,
            },
          }));
        }
      },
      async submitReview(hostelId, review) {
        set((state) => ({
          reviews: {
            ...state.reviews,
            [hostelId]: { ...review, id: hostelId },
          },
        }));
        try {
          const posted = await reviewApi.createReview({
            ...review,
            id: hostelId,
          });
          set((state) => ({
            reviews: {
              ...state.reviews,
              [hostelId]: posted,
            },
          }));
        } catch (e) {
          // Rollback optimistic update if needed
        }
      },
      async editReview(hostelId, review) {
        set((state) => ({
          reviews: {
            ...state.reviews,
            [hostelId]: {
              ...state.reviews[hostelId],
              ...review,
            },
          },
        }));
        // TODO: Call backend edit API if available
      },
    }),
    { name: 'review-store' },
  ),
);

