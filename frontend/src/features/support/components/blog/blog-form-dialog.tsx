'use client';

import {
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RumiVideo from '@/components/ui/RumiVideo/rumivideo';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { SupportBlogPost, CreateBlogPostData } from '../../types/types';

const BLOG_CATEGORIES = [
  { value: 'student_stories', label: 'Student Stories' },
  { value: 'landlord_tips', label: 'Landlord Tips' },
  { value: 'housing_guides', label: 'Housing Guides' },
  { value: 'company_news', label: 'Company News' },
  { value: 'product_updates', label: 'Product Updates' },
  { value: 'marketplace_highlights', label: 'Marketplace Highlights' },
];

interface BlogFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  post: SupportBlogPost | null;
  onSubmit: (data: CreateBlogPostData) => Promise<void>;
  isSaving: boolean;
}

export function BlogFormDialog({
  isOpen,
  onOpenChange,
  post,
  onSubmit,
  isSaving,
}: BlogFormDialogProps) {
  const [formData, setFormData] = useState<CreateBlogPostData>({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    video_url: '',
    category: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        featured_image: post.featured_image || '',
        video_url: post.video_url || '',
        category: post.category,
        tags: post.tags || [],
      });
    } else {
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        featured_image: '',
        video_url: '',
        category: '',
        tags: [],
      });
    }
    setTagInput('');
  }, [post, isOpen]);

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Clean data
    const cleanData = {
      ...formData,
      excerpt: formData.excerpt || undefined,
      featured_image: formData.featured_image || undefined,
      video_url: formData.video_url || undefined,
      tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
    };

    await onSubmit(cleanData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {post ? 'Edit Blog Post' : 'Create New Blog Post'}
          </DialogTitle>
          <DialogDescription>
            {post
              ? 'Update the blog post details below.'
              : 'Fill in the details for your new blog post.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter blog post title..."
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-base font-semibold">
              Category *
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {BLOG_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt" className="text-base font-semibold">
              Excerpt / Summary
            </Label>
            <Textarea
              id="excerpt"
              placeholder="Brief summary that appears in blog listings..."
              value={formData.excerpt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-base font-semibold">
              Content *
            </Label>
            <Textarea
              id="content"
              placeholder="Write your blog post content here..."
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Supports Markdown formatting.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="featured_image" className="text-base font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Featured Image URL
            </Label>
            <Input
              id="featured_image"
              placeholder="https://example.com/image.jpg"
              value={formData.featured_image}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, featured_image: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url" className="text-base font-semibold flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video URL (YouTube/Vimeo)
            </Label>
            <Input
              id="video_url"
              placeholder="https://youtube.com/watch?v=..."
              value={formData.video_url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, video_url: e.target.value }))
              }
            />
            {formData.video_url && (
              <div className="mt-3 rounded-lg overflow-hidden">
                <RumiVideo
                  url={formData.video_url}
                  title="Video Preview"
                  className="aspect-video w-full"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !formData.title ||
              !formData.content ||
              !formData.category ||
              isSaving
            }
          >
            {isSaving ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
