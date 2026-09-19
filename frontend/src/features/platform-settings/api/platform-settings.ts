import { axiosInstance as axios } from '@/lib/api/client';
import type { ConnectionTestResult, PlatformSetting, SettingGroup } from '../types';

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
};
