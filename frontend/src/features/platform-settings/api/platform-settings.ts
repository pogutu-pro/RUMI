import { axiosInstance as axios } from '@/lib/api/client';
import type { ConnectionTestResult, PlatformSetting, SettingGroup, SocialLinkRow, UnlockState } from '../types';

export const platformSettingsApi = {
  list: async (): Promise<SettingGroup[]> => {
    const res = await axios.get<{ groups: SettingGroup[] }>('/platform-settings/');
    return res.data.groups;
  },
  save: async (key: string, value: string | number | boolean): Promise<PlatformSetting> => {
    const res = await axios.put<PlatformSetting>(`/platform-settings/${key}/`, { value });
    return res.data;
  },
  reset: async (key: string): Promise<PlatformSetting> => {
    const res = await axios.delete<PlatformSetting>(`/platform-settings/${key}/`);
    return res.data;
  },
  test: async (kind: 'paystack' | 'email' | 'sms'): Promise<ConnectionTestResult> => {
    const res = await axios.post<ConnectionTestResult>(`/platform-settings/test/${kind}/`);
    return res.data;
  },
  unlockStatus: async (): Promise<UnlockState> => {
    const res = await axios.get<UnlockState>('/platform-settings/unlock-status/');
    return res.data;
  },
  unlock: async (password: string): Promise<UnlockState> => {
    const res = await axios.post<UnlockState>('/platform-settings/unlock/', { password });
    return res.data;
  },
  lock: async (): Promise<UnlockState> => {
    const res = await axios.post<UnlockState>('/platform-settings/lock/');
    return res.data;
  },
  socialLinks: async (): Promise<SocialLinkRow[]> => {
    const res = await axios.get<{ results: SocialLinkRow[] }>('/platform-settings/social-links/');
    return res.data.results;
  },
  saveSocialLink: async (platform: string, url: string): Promise<{ platform: string; url: string }> => {
    const res = await axios.put(`/platform-settings/social-links/${platform}/`, { url });
    return res.data;
  },
  removeSocialLink: async (platform: string): Promise<void> => {
    await axios.delete(`/platform-settings/social-links/${platform}/`);
  },
};
