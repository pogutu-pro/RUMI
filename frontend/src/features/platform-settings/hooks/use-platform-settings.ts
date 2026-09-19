'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { platformSettingsApi } from '../api/platform-settings';

const KEY = ['platform-settings'] as const;

export const usePlatformSettings = () =>
  useQuery({ queryKey: KEY, queryFn: platformSettingsApi.list, staleTime: 0, refetchOnMount: 'always' });

export const useSaveSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string | number | boolean }) =>
      platformSettingsApi.save(key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useResetSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => platformSettingsApi.reset(key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Reset. The value from the server file is used again.');
    },
    onError: (err) => toast.error((err as { message?: string })?.message || 'Could not reset the setting'),
  });
};

export const useConnectionTest = () =>
  useMutation({ mutationFn: (kind: 'paystack' | 'email' | 'sms') => platformSettingsApi.test(kind) });
