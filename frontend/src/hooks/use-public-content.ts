import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  getLandingContent,
  getAboutContent,
  getTeamMembers,
  getFAQs,
  getBlogPosts,
  getBlogPost,
  submitContactForm,
  subscribeNewsletter,
  ContactRequest,
} from '@/lib/api/public';
import { toast } from 'sonner';

export const useLandingContent = () => {
  return useQuery({
    queryKey: queryKeys.public.landing(),
    queryFn: getLandingContent,
  });
};

export const useAboutContent = () => {
  return useQuery({
    queryKey: queryKeys.public.about(),
    queryFn: getAboutContent,
  });
};

export const useTeamMembers = () => {
  return useQuery({
    queryKey: queryKeys.public.team(),
    queryFn: getTeamMembers,
  });
};

export const useFAQs = () => {
  return useQuery({
    queryKey: queryKeys.public.faqs(),
    queryFn: getFAQs,
  });
};

export const useBlogPosts = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: queryKeys.public.blog.list(page, limit),
    queryFn: () => getBlogPosts({ page, limit }),
  });
};

export const useBlogPost = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.public.blog.detail(slug),
    queryFn: () => getBlogPost(slug),
    enabled: !!slug,
  });
};

export const useSubmitContact = () => {
  return useMutation({
    mutationFn: (data: ContactRequest) => submitContactForm(data),
    onSuccess: () => {
      toast.success('Message sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    },
  });
};

export const useNewsletterSubscribe = () => {
  return useMutation({
    mutationFn: (email: string) => subscribeNewsletter(email),
    onSuccess: () => {
      toast.success('Subscribed to newsletter successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to subscribe to newsletter');
    },
  });
};
