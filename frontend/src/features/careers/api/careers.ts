import { axiosInstance as axios } from '@/lib/api/client';
import type { AdminJobPosting, JobPosting, JobPostingInput } from '../types';

export const careersApi = {
  listOpen: async (): Promise<JobPosting[]> => {
    const res = await axios.get<{ results: JobPosting[] }>('/home/careers/');
    return res.data.results;
  },
  adminList: async (): Promise<AdminJobPosting[]> => {
    const res = await axios.get<{ results: AdminJobPosting[] }>('/home/admin/careers/');
    return res.data.results;
  },
  create: async (payload: JobPostingInput): Promise<AdminJobPosting> => {
    const res = await axios.post<AdminJobPosting>('/home/admin/careers/', payload);
    return res.data;
  },
  update: async (id: number, payload: Partial<JobPostingInput>): Promise<AdminJobPosting> => {
    const res = await axios.patch<AdminJobPosting>(`/home/admin/careers/${id}/`, payload);
    return res.data;
  },
  remove: async (id: number): Promise<void> => {
    await axios.delete(`/home/admin/careers/${id}/`);
  },
};
