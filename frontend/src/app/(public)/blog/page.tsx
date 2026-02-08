"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Clock, Users, BookOpen, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animations/fade-in';
import { getBlogPosts } from '@/lib/api/public';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

type BlogCategory =
  | 'all'
  | 'students'
  | 'landlords'
  | 'caretakers'
  | 'product'
  | 'campus-life';

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  readTime: string;
  audienceLabel: string;
  tag: string;
  publishedAt: string;
  meta?: string;
  hasVideo?: boolean;
}

interface ApiBlogPost {
  post_id: number;
  title: string;
  slug: string;
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
    'student_stories': 'students',
    'landlord_tips': 'landlords',
    'housing_guides': 'students',
    'company_news': 'product',
    'product_updates': 'product',
    'marketplace_highlights': 'product',
  };

  const audienceLabels: Record<string, string> = {
    'student_stories': 'For Students',
    'landlord_tips': 'For Landlords',
    'housing_guides': 'For Students',
    'company_news': 'News',
    'product_updates': 'Updates',
    'marketplace_highlights': 'Featured',
  };

  return {
    slug: apiPost.slug,
    title: apiPost.title,
    description: apiPost.excerpt,
    category: categoryMap[apiPost.category] || 'product',
    readTime: `${apiPost.read_time_minutes || 5} min read`,
    audienceLabel: audienceLabels[apiPost.category] || 'Article',
    tag: apiPost.tags[0] || 'General',
    publishedAt: apiPost.published_at,
    meta: apiPost.tags.join(' • '),
    hasVideo: !!apiPost.video_url,
  };
}

const filters: { id: BlogCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'students', label: 'Students' },
  { id: 'landlords', label: 'Landlords' },
  { id: 'caretakers', label: 'Caretakers' },
  { id: 'product', label: 'Updates' },
];

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<BlogCategory>('all');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await getBlogPosts({ limit: 20 });
        // Handle different possible API response structures
         
        const responseAny = response as any;
        let postsData: ApiBlogPost[] = [];
        if (Array.isArray(responseAny)) {
          postsData = responseAny;
        } else if (responseAny?.data && Array.isArray(responseAny.data)) {
          postsData = responseAny.data;
        } else if (responseAny?.results && Array.isArray(responseAny.results)) {
          postsData = responseAny.results;
        }
        const transformedPosts = postsData.map(transformApiPost);
        setPosts(transformedPosts);
      } catch (err) {
        console.error('Failed to fetch blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
        toast.error('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const visiblePosts =
    activeFilter === 'all'
      ? posts
      : posts.filter((post) => post.category === activeFilter);

  const [featured, ...rest] = visiblePosts;

  // Loading state - Notion-style skeleton
  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 md:pt-24 md:pb-14">
            <div className="mx-auto max-w-3xl text-center">
              <Skeleton className="h-8 w-24 mx-auto mb-4" />
              <Skeleton className="h-14 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
            </div>
          </div>
        </section>
        <section className="py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <section className="border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 md:pt-24 md:pb-14">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Blog
              </h1>
              <p className="text-xl text-destructive font-medium">{error}</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero - Clean, Notion-style */}
      <section className="border-b border-border/50 bg-gradient-to-b from-muted/30 to-background">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 md:pt-24 md:pb-14">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="outline"
              className="mb-5 inline-flex items-center gap-2 border-border bg-background/80 px-4 py-2 text-sm font-semibold text-foreground"
            >
              <BookOpen className="h-4 w-4" />
              Rumia Blog
            </Badge>
            <h1 className="mb-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl leading-tight">
              Insights for better
              <br />
              campus living.
            </h1>
            <p className="mb-6 text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Guides, stories, and updates for students, landlords, and
              caretakers building safer, better managed hostels.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-base text-muted-foreground">
              <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">For Everyone</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Filters - Large, accessible buttons */}
      <section className="border-b border-border/50 bg-muted/20 sticky top-0 z-10 backdrop-blur-sm">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const is_active = filter.id === activeFilter;
                return (
                  <Button
                    key={filter.id}
                    size="lg"
                    variant={is_active ? 'default' : 'outline'}
                    className="rounded-full px-6 py-3 text-base font-semibold min-h-[48px]"
                    onClick={() => setActiveFilter(filter.id)}
                    aria-pressed={is_active}
                  >
                    {filter.label}
                  </Button>
                );
              })}
            </div>
            <div className="text-base font-medium text-muted-foreground flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {visiblePosts.length} article{visiblePosts.length !== 1 ? 's' : ''}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Blog Posts - Notion-style list */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Featured Post */}
          {featured && (
            <FadeIn className="mb-10">
              <Link href={`/blog/${featured.slug}`} className="block group">
                <Card className="overflow-hidden border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 p-0">
                  <div className="p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-sm font-semibold px-3 py-1">
                        Featured
                      </Badge>
                      <Badge variant="outline" className="text-sm font-medium">
                        {featured.audienceLabel}
                      </Badge>
                      {featured.hasVideo && (
                        <Badge variant="outline" className="text-sm font-medium text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                          📹 Video
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
                      {featured.title}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-5 leading-relaxed line-clamp-3">
                      {featured.description}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {featured.readTime}
                        </span>
                        <span>
                          {new Date(featured.publishedAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="lg"
                        className="text-primary font-semibold group-hover:bg-primary/10 min-h-[48px]"
                      >
                        Read article
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            </FadeIn>
          )}

          {/* Article List */}
          {rest.length > 0 && (
            <>
              <FadeIn className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  More Articles
                </h2>
              </FadeIn>
              <FadeInStagger className="space-y-4">
                {rest.map((post) => (
                  <FadeInItem key={post.slug}>
                    <Link href={`/blog/${post.slug}`} className="block group">
                      <Card className="border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200">
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-sm font-medium">
                              {post.audienceLabel}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {post.readTime}
                            </span>
                            {post.hasVideo && (
                              <Badge variant="outline" className="text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                                📹 Video
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                            {post.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <CardDescription className="text-base text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                            {post.description}
                          </CardDescription>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              Read
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </FadeInItem>
                ))}
              </FadeInStagger>
            </>
          )}

          {/* Empty state */}
          {visiblePosts.length === 0 && (
            <FadeIn className="text-center py-16">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                No articles found
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Check back soon for new content!
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setActiveFilter('all')}
                className="min-h-[48px]"
              >
                View all articles
              </Button>
            </FadeIn>
          )}
        </div>
      </section>
    </main>
  );
}
