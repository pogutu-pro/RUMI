import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as blogApi from '../api/blog';
import type { CreateBlogPostData, UpdateBlogPostData } from '../types/types';

// Query keys for blog
const blogQueryKeys = {
  all: ['support', 'blog'] as const,
  list: () => [...blogQueryKeys.all, 'list'] as const,
  detail: (id: number) => [...blogQueryKeys.all, 'detail', id] as const,
};

/**
 * Get all blog posts (drafts and published)
 */
export const useSupportBlogPosts = (params?: { page?: number; status?: string }) => {
  return useQuery({
    queryKey: [...blogQueryKeys.list(), params],
    queryFn: () => blogApi.getSupportBlogPosts(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Get a single blog post by ID
 */
export const useSupportBlogPost = (postId: number) => {
  return useQuery({
    queryKey: blogQueryKeys.detail(postId),
    queryFn: () => blogApi.getSupportBlogPost(postId),
    enabled: !!postId && postId > 0,
  });
};

/**
 * Create a new blog post
 */
export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBlogPostData) => blogApi.createSupportBlogPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
      toast.success('Blog post created successfully');
    },
    onError: () => {
      toast.error('Failed to create blog post');
    },
  });
};

/**
 * Update an existing blog post
 */
export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }: { postId: number; data: UpdateBlogPostData }) =>
      blogApi.updateSupportBlogPost(postId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.detail(variables.postId) });
      toast.success('Blog post updated successfully');
    },
    onError: () => {
      toast.error('Failed to update blog post');
    },
  });
};

/**
 * Delete a blog post
 */
export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => blogApi.deleteSupportBlogPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
      toast.success('Blog post deleted');
    },
    onError: () => {
      toast.error('Failed to delete blog post');
    },
  });
};

/**
 * Publish a blog post
 */
export const usePublishBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => blogApi.publishSupportBlogPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
      toast.success('Blog post published');
    },
    onError: () => {
      toast.error('Failed to publish blog post');
    },
  });
};

/**
 * Unpublish a blog post
 */
export const useUnpublishBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => blogApi.unpublishSupportBlogPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
      toast.success('Blog post unpublished');
    },
    onError: () => {
      toast.error('Failed to unpublish blog post');
    },
  });
};
