'use client';

import { useQuery } from '@tanstack/react-query';
import { axiosInstance as axios } from '@/lib/api/client';

export interface AttentionItem {
  key: string;
  tone: 'urgent' | 'warning' | 'info';
  count: number;
  title: string;
  detail: string;
  href: string;
}

export const useAttention = (enabled = true) =>
  useQuery({
    queryKey: ['attention'],
    queryFn: async () => (await axios.get<AttentionItem[]>('/attention/')).data,
    enabled,
    refetchInterval: 60_000,
  });

/** Badge counts for sidebar links: urgent + warning items only, so badges mean "act now". */
export function attentionBadges(items: AttentionItem[] = []): Record<string, number> {
  const badges: Record<string, number> = {};
  for (const item of items) {
    if (item.tone === 'info') continue;
    badges[item.href] = (badges[item.href] ?? 0) + item.count;
  }
  return badges;
}
