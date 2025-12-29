import api from '@/lib/api/client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api.types';
import type { SupportBlogPost, CreateBlogPostData, UpdateBlogPostData } from '../types/types';

/**
 * Get all blog posts for support (includes drafts)
 */
export const getSupportBlogPosts = async (params?: PaginationParams) => {
  const response = await api.axios.get<PaginatedResponse<SupportBlogPost>>('/support/blog/', { params });
  return response.data;
};

/**
 * Get a single blog post by ID
 */
export const getSupportBlogPost = async (postId: number) => {
  const response = await api.axios.get<ApiResponse<SupportBlogPost>>(`/support/blog/${postId}/`);
  return response.data.data;
};

/**
 * Create a new blog post
 */
export const createSupportBlogPost = async (data: CreateBlogPostData) => {
  const response = await api.axios.post<ApiResponse<SupportBlogPost>>('/support/blog/create/', data);
  return response.data.data;
};

/**
 * Update an existing blog post
 */
export const updateSupportBlogPost = async (postId: number, data: UpdateBlogPostData) => {
  const response = await api.axios.put<ApiResponse<SupportBlogPost>>(`/support/blog/${postId}/update/`, data);
  return response.data.data;
};

/**
 * Delete a blog post
 */
export const deleteSupportBlogPost = async (postId: number) => {
  const response = await api.axios.delete<ApiResponse<void>>(`/support/blog/${postId}/delete/`);
  return response.data;
};

/**
 * Publish a blog post
 */
export const publishSupportBlogPost = async (postId: number) => {
  const response = await api.axios.post<ApiResponse<SupportBlogPost>>(`/support/blog/${postId}/publish/`);
  return response.data.data;
};

/**
 * Unpublish a blog post
 */
export const unpublishSupportBlogPost = async (postId: number) => {
  const response = await api.axios.post<ApiResponse<SupportBlogPost>>(`/support/blog/${postId}/unpublish/`);
  return response.data.data;
};
