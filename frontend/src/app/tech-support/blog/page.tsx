'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSupportBlogPosts,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  usePublishBlogPost,
  useUnpublishBlogPost,
  BlogStats,
  BlogListTable,
  BlogFormDialog,
} from '@/features/support';
import type { SupportBlogPost, CreateBlogPostData } from '@/features/support';

export default function TechSupportBlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SupportBlogPost | null>(null);

  // API hooks
  const { data: blogData, isLoading, refetch } = useSupportBlogPosts();
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();
  const deleteMutation = useDeleteBlogPost();
  const publishMutation = usePublishBlogPost();
  const unpublishMutation = useUnpublishBlogPost();

  const posts = blogData?.data || [];

  // Filter posts
  const filteredPosts = posts.filter((post: SupportBlogPost) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: posts.length,
    published: posts.filter((p: SupportBlogPost) => p.status === 'published').length,
    drafts: posts.filter((p: SupportBlogPost) => p.status === 'draft').length,
  };

  const handleOpenCreate = () => {
    setEditingPost(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (post: SupportBlogPost) => {
    setEditingPost(post);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: CreateBlogPostData) => {
    if (editingPost) {
      await updateMutation.mutateAsync({
        postId: editingPost.post_id,
        data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsFormOpen(false);
  };

  const handlePublishToggle = async (post: SupportBlogPost) => {
    if (post.status === 'published') {
      await unpublishMutation.mutateAsync(post.post_id);
    } else {
      await publishMutation.mutateAsync(post.post_id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Blog Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage blog posts for the public Rumi blog.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <BlogStats {...stats} />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Blog Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Blog Posts</CardTitle>
          <CardDescription>
            {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlogListTable
            posts={filteredPosts}
            isLoading={isLoading}
            onEdit={handleOpenEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
            onTogglePublish={handlePublishToggle}
            isPublishing={publishMutation.isPending || unpublishMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Blog Form Dialog */}
      <BlogFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        post={editingPost}
        onSubmit={handleFormSubmit}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
