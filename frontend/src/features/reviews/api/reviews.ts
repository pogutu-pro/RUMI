import apiClient from '@/lib/api/client';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';
import { Review, ReviewTag, ReviewReaction } from '../types';

// -- Types (if not already defined in @/features/reviews) --
// Assuming Review, ReviewTag, ReviewReaction are imported correctly.

// -- API Service --

export const reviewsApi = {
  // List Reviews
  // GET /api/v1/reviews/
  getReviews: async (params?: any) => {
    const res = await apiClient.get<PaginatedResponse<Review>>(
      '/reviews/',
      { params }
    );
    return res.data;
  },

  // Get Hostel Reviews
  // GET /api/v1/hostels/{id}/reviews/
  getHostelReviews: async (hostelId: string, params?: any) => {
    const res = await apiClient.get<PaginatedResponse<Review>>(
      `/hostels/${hostelId}/reviews/`,
      { params }
    );
    return res.data.data; // Adapting based on likely response structure
  },

  // Get My Reviews
  // GET /api/v1/reviews/me/
  getMyReviews: async () => {
    const res = await apiClient.get<PaginatedResponse<Review>>(
      '/reviews/me/'
    );
    return res.data.data;
  },

  // Create Review
  // POST /api/v1/reviews/
  createReview: async (data: Partial<Review>) => {
    const res = await apiClient.post<ApiResponse<Review>>(
      '/reviews/',
      data
    );
    return res.data.data;
  },

  // Update Review
  // PATCH /api/v1/reviews/{id}/
  updateReview: async (id: string, data: Partial<Review>) => {
    const res = await apiClient.patch<ApiResponse<Review>>(
      `/reviews/${id}/`,
      data
    );
    return res.data.data;
  },

  // Delete Review
  // DELETE /api/v1/reviews/{id}/
  deleteReview: async (id: string) => {
    await apiClient.delete(`/reviews/${id}/`);
  },

  // Add Helpful Vote
  // POST /api/v1/reviews/{id}/vote/
  addHelpfulVote: async (reviewId: string) => {
    await apiClient.post(`/reviews/${reviewId}/vote/`);
  },

  // Add Reaction
  // POST /api/v1/reviews/{id}/reaction/
  addReaction: async (reviewId: string, emoji: string) => {
    await apiClient.post(`/reviews/${reviewId}/reaction/`, { emoji });
  },

  // Flag Review
  // POST /api/v1/reviews/{id}/flag/
  flagReview: async (id: string, reason?: string) => {
    await apiClient.post(`/reviews/${id}/flag/`, { reason });
  },

  // Unflag Review
  // POST /api/v1/reviews/{id}/unflag/
  unflagReview: async (id: string) => {
    await apiClient.post(`/reviews/${id}/unflag/`);
  },
};

// Export standalone functions if legacy code uses them directly, 
// mapping them to the new object for consistency.
export const getReviews = reviewsApi.getReviews;
export const getHostelReviews = reviewsApi.getHostelReviews;
export const getMyReviews = reviewsApi.getMyReviews;
export const createReview = reviewsApi.createReview;
export const updateReview = reviewsApi.updateReview;
export const deleteReview = reviewsApi.deleteReview;
export const addHelpfulVote = reviewsApi.addHelpfulVote;
export const addReaction = reviewsApi.addReaction;
export const flagReview = reviewsApi.flagReview;
export const unflagReview = reviewsApi.unflagReview;
