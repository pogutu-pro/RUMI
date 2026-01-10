import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReviews, createReview, deleteReview, flagReview } from '@/features/reviews';
import { queryKeys } from '@/lib/react-query/query-keys';

export const useReviews = () => {
  return useQuery({
    queryKey: queryKeys.reviews.all,
    queryFn: getReviews,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });
};

export const useFlagReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => flagReview(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });
};
