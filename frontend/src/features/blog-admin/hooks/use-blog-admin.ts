'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { blogAdminApi } from '../api/blog-admin';
import type { BlogPostInput } from '../types';

function errorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { message?: string };
  return anyErr?.message || fallback;
}

const keys = {
  list: (filters?: Record<string, unknown>) => ['blog-admin', 'list', filters ?? {}] as const,
  detail: (id: number) => ['blog-admin', 'detail', id] as const,
};

export const useAdminBlogPosts = (filters?: { is_published?: boolean; category?: string; search?: string }) =>
  useQuery({ queryKey: keys.list(filters), queryFn: () => blogAdminApi.list(filters) });

export const useAdminBlogPost = (id: number | undefined) =>
  useQuery({
    queryKey: keys.detail(id ?? -1),
    queryFn: () => blogAdminApi.get(id as number),
    enabled: typeof id === 'number',
  });

export const useCreateBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BlogPostInput) => blogAdminApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-admin', 'list'] });
      toast.success('Post created');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not create post')),
  });
};

export const useUpdateBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<BlogPostInput> }) =>
      blogAdminApi.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['blog-admin', 'list'] });
      qc.invalidateQueries({ queryKey: keys.detail(id) });
      toast.success('Post updated');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not update post')),
  });
};

export const useDeleteBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => blogAdminApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-admin', 'list'] });
      toast.success('Post deleted');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not delete post')),
  });
};

export const useUploadBlogCover = () =>
  useMutation({
    mutationFn: (file: File) => blogAdminApi.uploadCover(file),
    onError: (err) => toast.error(errorMessage(err, 'Could not upload image')),
  });
