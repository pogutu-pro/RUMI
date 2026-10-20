'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Plus, Eye, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils/cn';
import { useAdminBlogPosts, useDeleteBlogPost } from '@/features/blog-admin/hooks/use-blog-admin';
import { BLOG_CATEGORIES } from '@/features/blog-admin/types';
import { usePagination } from '@/hooks/use-pagination';
import { SimplePager } from '@/components/ui/simple-pager';

type StatusFilter = 'all' | 'published' | 'draft';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

function categoryLabel(value: string): string {
  return BLOG_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export default function BlogAdminPage() {
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [search, setSearch] = React.useState('');
  const [pendingDeleteId, setPendingDeleteId] = React.useState<number | null>(null);

  const { data: posts = [], isLoading } = useAdminBlogPosts(
    status === 'all' ? undefined : { is_published: status === 'published' },
  );
  const deletePost = useDeleteBlogPost();

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => p.title.toLowerCase().includes(q));
  }, [posts, search]);
  const { pageItems: pagedFiltered, pagerProps: filteredPager } = usePagination(filtered, 10, `${status}|${search}`);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <PageHeader title="Blog posts" />
        <Link href="/tech-support/dashboard/blog/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New post
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                status === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          variant={search || status !== 'all' ? 'search' : 'add'}
          title={search || status !== 'all' ? 'No posts match' : 'No posts yet'}
          description={
            search || status !== 'all'
              ? 'Try a different search or status.'
              : 'Write the first post for the RumiaRent blog.'
          }
          action={
            !search && status === 'all' ? (
              <Link href="/tech-support/dashboard/blog/new">
                <Button className="gap-1.5">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  New post
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
        <ul className="divide-y rounded-2xl border bg-background">
          {pagedFiltered.map((post) => (
            <li key={post.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <Link
                href={`/tech-support/dashboard/blog/${post.id}/edit`}
                className="min-w-0 flex-1 text-sm hover:underline"
              >
                <span className="block truncate font-medium">{post.title}</span>
                <span className="text-xs text-muted-foreground">
                  {categoryLabel(post.category)} · {post.author.name} ·{' '}
                  {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })}
                  {post.is_published ? ` · ${post.view_count} views` : ''}
                </span>
              </Link>
              <span className="flex shrink-0 items-center gap-2">
                <Badge variant={post.is_published ? 'default' : 'secondary'}>
                  {post.is_published ? 'Published' : 'Draft'}
                </Badge>
                {post.is_published && (
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="View live post"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => setPendingDeleteId(post.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete post"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
        <SimplePager {...filteredPager} />
        </>
      )}

      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(o) => !o && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. If it&apos;s published, it disappears from the blog immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteId !== null) deletePost.mutate(pendingDeleteId);
                setPendingDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
