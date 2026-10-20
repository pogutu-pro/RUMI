'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BLOG_CATEGORIES } from '@/features/blog-admin/types';
import { useUploadBlogCover } from '@/features/blog-admin/hooks/use-blog-admin';
import type { AdminBlogPost, BlogPostInput } from '@/features/blog-admin/types';

const blogFormSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Choose a category'),
  excerpt: z.string().trim().max(300, 'Keep the excerpt under 300 characters').optional(),
  content: z.string().trim().min(20, 'Write at least a few sentences'),
  tags: z.string().optional(), // comma-separated in the form, split on submit
  is_published: z.boolean(),
});

type BlogFormData = z.infer<typeof blogFormSchema>;

interface BlogFormProps {
  post?: AdminBlogPost;
  onSubmit: (payload: BlogPostInput) => Promise<unknown>;
  submitting: boolean;
}

export function BlogForm({ post, onSubmit, submitting }: BlogFormProps) {
  const router = useRouter();
  const uploadCover = useUploadBlogCover();
  const [coverUrl, setCoverUrl] = React.useState<string | null>(post?.featured_image ?? null);
  const [coverFile, setCoverFile] = React.useState<File | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: post?.title ?? '',
      category: post?.category ?? '',
      excerpt: post?.excerpt ?? '',
      content: post?.content ?? '',
      tags: post?.tags?.join(', ') ?? '',
      is_published: post?.is_published ?? false,
    },
  });

  const handleFormSubmit = handleSubmit(async (data) => {
    let featured_image = coverUrl ?? undefined;
    if (coverFile) {
      featured_image = await uploadCover.mutateAsync(coverFile);
    }

    await onSubmit({
      title: data.title,
      category: data.category,
      excerpt: data.excerpt || undefined,
      content: data.content,
      tags: data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      is_published: data.is_published,
      featured_image,
    });
  });

  const busy = submitting || uploadCover.isPending;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} disabled={busy} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={busy}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {BLOG_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>

      <ImageUpload
        label="Cover image"
        aspectRatio="16/9"
        currentImageUrl={coverUrl}
        disabled={busy}
        onImageChange={(file) => {
          setCoverFile(file);
          if (!file) setCoverUrl(null);
        }}
      />

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea id="excerpt" rows={2} {...register('excerpt')} disabled={busy} />
        <p className="text-xs text-muted-foreground">Short summary shown on the blog list. Optional.</p>
        {errors.excerpt && <p className="text-sm text-destructive">{errors.excerpt.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" rows={14} {...register('content')} disabled={busy} />
        <p className="text-xs text-muted-foreground">
          Separate paragraphs with a blank line — that&apos;s how the public blog page splits them.
        </p>
        {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" placeholder="e.g. rent, mpesa, onboarding" {...register('tags')} disabled={busy} />
        <p className="text-xs text-muted-foreground">Comma-separated.</p>
      </div>

      <Controller
        control={control}
        name="is_published"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div>
              <p className="text-sm font-medium">Published</p>
              <p className="text-xs text-muted-foreground">
                Off keeps this a draft, visible only here. On makes it live on rumiarent.com/blog.
              </p>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={busy} />
          </div>
        )}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {post ? 'Save changes' : 'Create post'}
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => router.push('/tech-support/dashboard/blog')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
