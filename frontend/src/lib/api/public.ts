import api from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api.types';

export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  tags: string[];
  coverImage?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpfulCount: number;
}

export const getLandingContent = async () => {
  const response = await api.axios.get<ApiResponse<any>>('/home/');
  return response.data.data;
};

export const getAboutContent = async () => {
  const response = await api.axios.get<ApiResponse<any>>('/home/about/');
  return response.data.data;
};

export const getTeamMembers = async () => {
  const response = await api.axios.get<ApiResponse<any[]>>('/home/team/');
  return response.data.data || [];
};

export const submitContactForm = async (data: ContactRequest) => {
  const response = await api.axios.post<ApiResponse<any>>('/home/contact/', data);
  return response.data;
};

export const getContactInfo = async () => {
  const response = await api.axios.get<ApiResponse<any>>('/home/contact/info/');
  return response.data.data;
};

export const getFAQs = async () => {
  const response = await api.axios.get<ApiResponse<FAQ[]>>('/home/faq/');
  return response.data.data || [];
};

export const markFAQHelpful = async (id: string) => {
  const response = await api.axios.put<ApiResponse<any>>(`/home/faq/${id}/helpful/`);
  return response.data.data;
};

export const getBlogPosts = async (params?: PaginationParams) => {
  const response = await api.axios.get<PaginatedResponse<BlogPost>>('/home/blog/', { params });
  return response.data;
};

export const getBlogPost = async (slug: string) => {
  const response = await api.axios.get<ApiResponse<BlogPost>>(`/home/blog/${slug}/`);
  if (!response.data.data) throw new Error('Post not found');
  return response.data.data;
};

export const subscribeNewsletter = async (email: string) => {
  const response = await api.axios.post<ApiResponse<any>>('/home/newsletter/subscribe/', { email });
  return response.data;
};

export const verifyNewsletter = async (token: string) => {
  const response = await api.axios.post<ApiResponse<any>>('/home/newsletter/verify/', { token });
  return response.data;
};

export const unsubscribeNewsletter = async (email: string) => {
  const response = await api.axios.post<ApiResponse<any>>('/home/newsletter/unsubscribe/', { email });
  return response.data;
};

/**
 * ================================================================================
 * README: Public API Module (public.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Handles public-facing content - landing page, about page, team, FAQ, blog,
 * contact form, and newsletter. No authentication required.
 *
 * ENDPOINTS:
 * ----------
 * | Method | Endpoint                       | Function             |
 * |--------|-------------------------------|----------------------|
 * | GET    | /home/                        | getLandingContent()  |
 * | GET    | /home/about/                  | getAboutContent()    |
 * | GET    | /home/team/                   | getTeamMembers()     |
 * | POST   | /home/contact/                | submitContactForm()  |
 * | GET    | /home/contact/info/           | getContactInfo()     |
 * | GET    | /home/faq/                    | getFAQs()            |
 * | PUT    | /home/faq/{id}/helpful/       | markFAQHelpful()     |
 * | GET    | /home/blog/                   | getBlogPosts()       |
 * | GET    | /home/blog/{slug}/            | getBlogPost()        |
 * | POST   | /home/newsletter/subscribe/   | subscribeNewsletter()|
 * | POST   | /home/newsletter/unsubscribe/ | unsubscribeNewsletter()|
 *
 * USAGE:
 * ------
 * ```typescript
 * import { getLandingContent, getFAQs, submitContactForm } from './public';
 *
 * const content = await getLandingContent();
 * const faqs = await getFAQs();
 * await submitContactForm({ name: 'John', email: '...', message: '...' });
 * ```
 *
 * ================================================================================
 */
