'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Users, BookOpen, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getBlogPost, getBlogPosts } from '@/lib/api/public';
import { toast } from 'sonner';
import RumiVideo from '@/components/ui/RumiVideo/rumivideo';
import { use } from 'react';

type BlogCategory =
  | 'all'
  | 'tenants'
  | 'landlords'
  | 'caretakers'
  | 'product'
  | 'campus-life';

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  category: BlogCategory;
  readTime: string;
  audienceLabel: string;
  tag: string;
  publishedAt: string;
  meta?: string;
  videoUrl?: string;
  coverImage?: string;
  author?: {
    name: string;
    avatar?: string;
  };
}

interface ApiBlogPost {
  post_id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  video_url?: string;
  author: {
    name: string;
    profile_picture?: string;
  };
  category: string;
  tags: string[];
  read_time_minutes: number;
  published_at: string;
  view_count: number;
}

function transformApiPost(apiPost: ApiBlogPost): BlogPost {
  const categoryMap: Record<string, BlogCategory> = {
    'student_stories': 'tenants',
    'landlord_tips': 'landlords',
    'housing_guides': 'tenants',
    'company_news': 'product',
    'product_updates': 'product',
    'marketplace_highlights': 'product',
  };

  const audienceLabels: Record<string, string> = {
    'student_stories': 'For Tenants',
    'landlord_tips': 'For Landlords',
    'housing_guides': 'For Tenants',
    'company_news': 'News',
    'product_updates': 'Updates',
    'marketplace_highlights': 'Featured',
  };

  return {
    slug: apiPost.slug,
    title: apiPost.title,
    description: apiPost.excerpt,
    content: apiPost.content,
    category: categoryMap[apiPost.category] || 'product',
    readTime: `${apiPost.read_time_minutes || 5} min read`,
    audienceLabel: audienceLabels[apiPost.category] || 'Article',
    tag: apiPost.tags[0] || 'General',
    publishedAt: apiPost.published_at,
    meta: apiPost.tags.join(' • '),
    videoUrl: apiPost.video_url,
    coverImage: apiPost.featured_image,
    author: apiPost.author,
  };
}

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the main post
        const postData = await getBlogPost(slug);
        const transformedPost = transformApiPost(postData as any);
        setPost(transformedPost);

        // Fetch related posts
        const allPosts = await getBlogPosts({ limit: 10 });
        // Handle different possible API response structures
         
        // Same shape as the list page (blog/page.tsx) — the real response
        // is {total_posts, posts}, not {data: [...]} or {results: [...]}.
        const allPostsAny = allPosts as any;
        let allPostsData: ApiBlogPost[] = [];
        if (Array.isArray(allPostsAny)) {
          allPostsData = allPostsAny;
        } else if (allPostsAny?.posts && Array.isArray(allPostsAny.posts)) {
          allPostsData = allPostsAny.posts;
        } else if (allPostsAny?.data && Array.isArray(allPostsAny.data)) {
          allPostsData = allPostsAny.data;
        } else if (allPostsAny?.results && Array.isArray(allPostsAny.results)) {
          allPostsData = allPostsAny.results;
        }
        const related = allPostsData
          .filter((p: ApiBlogPost) => p.slug !== slug && p.category === (postData as any).category)
          .slice(0, 3)
          .map(transformApiPost);
        setRelatedPosts(related);
      } catch (err) {
        console.error('Failed to fetch blog post:', err);
        setError('Article not found');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="border-b border-border/50 bg-muted/20">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-10 pb-20">
          <div className="max-w-3xl">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error/Not found state
  if (error || !post) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:border-primary/50 hover:bg-muted transition-colors min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all articles
            </Link>
          </div>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground">
                Article not found
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                The article you&apos;re looking for could not be found. It may have
                been moved or unpublished.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6 text-lg">
                You can return to the blog home to explore other guides, product
                updates, and campus living tips.
              </p>
              <Button asChild size="lg" className="min-h-[48px]">
                <Link href="/blog">Go to blog</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top Navigation Bar */}
      <div className="border-b border-border/50 bg-muted/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-4 pb-4 flex items-center justify-between gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:border-primary/50 hover:bg-muted transition-colors min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to blog</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-10 md:pt-16 pb-20 grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-10 lg:gap-14">
        <article className="lg:border-r lg:border-border/50 lg:pr-10 xl:pr-14">
          {/* Header */}
          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-sm font-semibold px-3 py-1">
                {post.audienceLabel}
              </Badge>
              <Badge variant="outline" className="text-sm font-medium">
                {post.tag}
              </Badge>
              {post.videoUrl && (
                <Badge variant="outline" className="text-sm font-medium text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                  <Video className="h-3.5 w-3.5 mr-1" />
                  Video
                </Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight mb-5">
              {post.title}
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed mb-6 max-w-2xl">
              {post.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {post.author && (
                <span className="font-medium text-foreground">
                  By {post.author.name}
                </span>
              )}
              <span>
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </span>
            </div>
          </header>

          {/* Video Section */}
          {post.videoUrl && (
            <div className="mb-10">
              <RumiVideo
                url={post.videoUrl}
                title={post.title}
                thumbnail={post.coverImage}
                className="rounded-xl overflow-hidden"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            {/* Render content - in a real app this would be rendered markdown */}
            <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
              {post.content.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Article Footer */}
          <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-8">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium">Share this guide</span>
              <span className="text-border">•</span>
              <span>Ideal for {post.audienceLabel.toLowerCase()}</span>
            </div>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full font-semibold min-h-[48px]"
            >
              <Link href="/blog" className="inline-flex items-center gap-2">
                More articles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </footer>
        </article>

        {/* Sidebar */}
        <aside className="lg:pt-4 space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground">
                About this article
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Quick overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">Audience</span>
                <span className="text-muted-foreground">{post.audienceLabel}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">Category</span>
                <span className="text-muted-foreground capitalize">{post.category.replace('-', ' ')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">Reading time</span>
                <span className="text-muted-foreground">{post.readTime}</span>
              </div>
              {post.meta && (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">Topics</span>
                  <span className="text-muted-foreground">{post.meta}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {relatedPosts.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground">
                  Related articles
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Keep reading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group block rounded-lg border border-transparent px-3 py-2 hover:border-border hover:bg-muted transition-colors"
                  >
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1 leading-snug">
                      {related.title}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {related.description}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </main>
  );
}
