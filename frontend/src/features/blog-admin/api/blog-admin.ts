import { axiosInstance as axios } from '@/lib/api/client';
import type { AdminBlogPost, BlogPostInput } from '../types';

export const blogAdminApi = {
  list: async (params?: { is_published?: boolean; category?: string; search?: string }): Promise<AdminBlogPost[]> => {
    const res = await axios.get<AdminBlogPost[]>('/home/admin/blog/', { params });
    return res.data;
  },
  get: async (id: number): Promise<AdminBlogPost> => {
    const res = await axios.get<AdminBlogPost>(`/home/admin/blog/${id}/`);
    return res.data;
  },
  create: async (payload: BlogPostInput): Promise<AdminBlogPost> => {
    const res = await axios.post<AdminBlogPost>('/home/admin/blog/', payload);
    return res.data;
  },
  update: async (id: number, payload: Partial<BlogPostInput>): Promise<AdminBlogPost> => {
    const res = await axios.patch<AdminBlogPost>(`/home/admin/blog/${id}/`, payload);
    return res.data;
  },
  remove: async (id: number): Promise<void> => {
    await axios.delete(`/home/admin/blog/${id}/`);
  },
  uploadCover: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    // Content-Type: undefined, not a hardcoded 'multipart/form-data' string
    // — that string has no boundary= parameter, which breaks Django's
    // multipart parser (request.FILES ends up empty). undefined removes
    // the axios instance's default 'application/json' header for this
    // call so the browser sets Content-Type itself, boundary included.
    const res = await axios.post<{ featured_image: string }>(
      '/home/admin/blog/upload-cover/',
      formData,
      { headers: { 'Content-Type': undefined } },
    );
    return res.data.featured_image;
  },
};
