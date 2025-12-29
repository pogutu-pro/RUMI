'use client';

import {
  FileEdit,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import type { SupportBlogPost } from '../../types/types';

const BLOG_CATEGORIES = [
  { value: 'student_stories', label: 'Student Stories' },
  { value: 'landlord_tips', label: 'Landlord Tips' },
  { value: 'housing_guides', label: 'Housing Guides' },
  { value: 'company_news', label: 'Company News' },
  { value: 'product_updates', label: 'Product Updates' },
  { value: 'marketplace_highlights', label: 'Marketplace Highlights' },
];

interface BlogListTableProps {
  posts: SupportBlogPost[];
  isLoading: boolean;
  onEdit: (post: SupportBlogPost) => void;
  onDelete: (postId: number) => void;
  onTogglePublish: (post: SupportBlogPost) => void;
  isPublishing: boolean;
}

export function BlogListTable({
  posts,
  isLoading,
  onEdit,
  onDelete,
  onTogglePublish,
  isPublishing,
}: BlogListTableProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileEdit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No blog posts found
        </h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold">Title</TableHead>
            <TableHead className="font-bold">Category</TableHead>
            <TableHead className="font-bold">Status</TableHead>
            <TableHead className="font-bold">Created</TableHead>
            <TableHead className="font-bold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.post_id}>
              <TableCell>
                <div className="max-w-xs">
                  <p className="font-semibold text-foreground truncate">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {post.video_url && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        <Video className="h-2.5 w-2.5 mr-0.5" />
                        Video
                      </Badge>
                    )}
                    {post.featured_image && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        <ImageIcon className="h-2.5 w-2.5 mr-0.5" />
                        Image
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {BLOG_CATEGORIES.find((c) => c.value === post.category)?.label || post.category}
                </Badge>
              </TableCell>
              <TableCell>
                {post.status === 'published' ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Published
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Draft
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(post)}
                    className="h-8 w-8 p-0"
                  >
                    <FileEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTogglePublish(post)}
                    disabled={isPublishing}
                    className="h-8 w-8 p-0"
                    title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                  >
                    {post.status === 'published' ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Dialog
                    open={deleteConfirmId === post.post_id}
                    onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(post.post_id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Blog Post</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete &ldquo;{post.title}&rdquo;? This action
                          cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            onDelete(post.post_id);
                            setDeleteConfirmId(null);
                          }}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
