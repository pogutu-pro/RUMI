'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/page-header';
import { BlogForm } from '../_components/blog-form';
import { useCreateBlogPost } from '@/features/blog-admin/hooks/use-blog-admin';

export default function NewBlogPostPage() {
  const router = useRouter();
  const createPost = useCreateBlogPost();

  return (
    <div className="space-y-4">
      <PageHeader title="New post" />
      <BlogForm
        submitting={createPost.isPending}
        onSubmit={async (payload) => {
          await createPost.mutateAsync(payload);
          router.push('/tech-support/dashboard/blog');
        }}
      />
    </div>
  );
}
