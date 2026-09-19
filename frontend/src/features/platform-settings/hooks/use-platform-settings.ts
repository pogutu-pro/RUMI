'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { platformSettingsApi } from '../api/platform-settings';

const KEY = ['platform-settings'] as const;

export const usePlatformSettings = (enabled = true) =>
  useQuery({ queryKey: KEY, queryFn: platformSettingsApi.list, staleTime: 0, refetchOnMount: 'always', enabled, retry: false });

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

const UNLOCK_KEY = ['platform-settings', 'unlock'] as const;

/** Whether the admin has recently re-entered their password. */
export const useUnlockStatus = () =>
  useQuery({
    queryKey: UNLOCK_KEY,
    queryFn: platformSettingsApi.unlockStatus,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: false,
  });

export const useUnlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => platformSettingsApi.unlock(password),
    onSuccess: (state) => {
      qc.setQueryData(UNLOCK_KEY, state);
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
};

export const useLock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: platformSettingsApi.lock,
    onSuccess: (state) => {
      qc.setQueryData(UNLOCK_KEY, state);
      qc.removeQueries({ queryKey: KEY });
      qc.removeQueries({ queryKey: ['platform-settings', 'social'] });
    },
  });
};

export const useSocialLinksAdmin = (enabled = true) =>
  useQuery({
    queryKey: ['platform-settings', 'social'],
    queryFn: platformSettingsApi.socialLinks,
    enabled,
    staleTime: 0,
    retry: false,
  });

export const useSaveSocialLink = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ platform, url }: { platform: string; url: string }) =>
      platformSettingsApi.saveSocialLink(platform, url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-settings', 'social'] });
      qc.invalidateQueries({ queryKey: ['social-links'] });
    },
  });
};

export const useRemoveSocialLink = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platform: string) => platformSettingsApi.removeSocialLink(platform),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-settings', 'social'] });
      qc.invalidateQueries({ queryKey: ['social-links'] });
      toast.success('Link removed from the public site');
    },
    onError: (err) => toast.error((err as { message?: string })?.message || 'Could not remove the link'),
  });
};
