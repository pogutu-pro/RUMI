'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { careersApi } from '../api/careers';
import type { JobPostingInput } from '../types';

// Open roles change when tech support posts one; keep the public list fresh.
export const useOpenRoles = () =>
  useQuery({
    queryKey: ['careers', 'open'],
    queryFn: careersApi.listOpen,
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

export const useAdminJobPostings = () =>
  useQuery({ queryKey: ['careers', 'admin'], queryFn: careersApi.adminList });

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['careers'] });
}

const message = (err: unknown, fallback: string) => (err as { message?: string })?.message || fallback;

export const useCreateJobPosting = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: JobPostingInput) => careersApi.create(payload),
    onSuccess: (job) => {
      invalidate();
      toast.success(job.status === 'published' ? 'Role published on the careers page' : 'Draft saved');
    },
    onError: (err) => toast.error(message(err, 'Could not save the role')),
  });
};

export const useUpdateJobPosting = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<JobPostingInput> }) =>
      careersApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success('Role updated');
    },
    onError: (err) => toast.error(message(err, 'Could not update the role')),
  });
};

export const useDeleteJobPosting = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => careersApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Role deleted');
    },
    onError: (err) => toast.error(message(err, 'Could not delete the role')),
  });
};
