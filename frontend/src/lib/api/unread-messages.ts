import { axiosInstance as axios } from '@/lib/api/client';
import { withFallback } from '@/lib/api/fallbacks';

/**
 * Get unread message count
 * WITH FALLBACK: Returns 0 if endpoint not implemented yet
 */
export async function getUnreadCount(): Promise<number> {
  return withFallback(
    async () => {
      const res = await axios.get<{ success: boolean; data: { count: number } }>(
        '/messages/unread-count/'
      );
      return res.data.data.count;
    },
    0, // Fallback to 0 if endpoint missing
    'Unread message count endpoint not available'
  );
}

export const unreadMessagesApi = {
  getUnreadCount,
};
