'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/page-header';
import { BlogForm } from '../../_components/blog-form';
import { useAdminBlogPost, useUpdateBlogPost } from '@/features/blog-admin/hooks/use-blog-admin';

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: post, isLoading } = useAdminBlogPost(Number.isFinite(id) ? id : undefined);
  const updatePost = useUpdateBlogPost();

  return (
    <div className="space-y-4">
      <PageHeader title="Edit post" />
      {isLoading || !post ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <BlogForm
          post={post}
          submitting={updatePost.isPending}
          onSubmit={async (payload) => {
            await updatePost.mutateAsync({ id, payload });
            router.push('/tech-support/dashboard/blog');
          }}
        />
      )}
    </div>
  );
}
