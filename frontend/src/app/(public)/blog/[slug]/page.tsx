import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Clock, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

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
}

const posts: BlogPost[] = [
  {
    slug: 'how-to-choose-the-right-campus-hostel',
    title: 'How to Choose the Right Campus Hostel (Without Guesswork)',
    description:
      'A practical checklist for comparing prices, safety, distance to campus, and amenities before you book.',
    category: 'students',
    readTime: '7 min read',
    audienceLabel: 'For Students',
    tag: 'Student Guides',
    publishedAt: '2025-02-01',
    meta: 'Hostel selection • Safety • Budget',
  },
  {
    slug: 'turn-your-hostel-into-a-fully-booked-business',
    title: 'Turn Your Hostel into a Fully Booked Business with Rumi',
    description:
      'How landlords use Rumi to reduce vacancies, get paid on time, and gain visibility with thousands of students.',
    category: 'landlords',
    readTime: '6 min read',
    audienceLabel: 'For Landlords',
    tag: 'Landlord Playbook',
    publishedAt: '2025-01-24',
    meta: 'Occupancy • Payments • Growth',
  },
  {
    slug: 'inside-the-rumi-safety-and-verification-process',
    title: 'Inside the Rumi Safety & Verification Process',
    description:
      'A behind-the-scenes look at how we verify hostels, photos, and licenses before they ever go live.',
    category: 'product',
    readTime: '5 min read',
    audienceLabel: 'Product Deep Dive',
    tag: 'Product Updates',
    publishedAt: '2025-01-10',
    meta: 'Verification • Trust • Quality',
  },
  {
    slug: 'caretaker-handbook-daily-ops-in-a-digital-hostel',
    title: 'Caretaker Handbook: Daily Ops in a Digital-First Hostel',
    description:
      'Best practices for managing check-ins, maintenance, and tenant requests when everything runs through Rumi.',
    category: 'caretakers',
    readTime: '8 min read',
    audienceLabel: 'For Caretakers',
    tag: 'Operations',
    publishedAt: '2024-12-18',
    meta: 'Operations • Maintenance • Service',
  },
  {
    slug: 'mpesa-rent-payments-how-rumi-keeps-everyone-in-sync',
    title: 'M-PESA Rent Payments: How Rumi Keeps Everyone in Sync',
    description:
      'From payment reminders to instant receipts, here is how rent collection works when everything is digital.',
    category: 'product',
    readTime: '4 min read',
    audienceLabel: 'Product Deep Dive',
    tag: 'Payments',
    publishedAt: '2024-11-30',
    meta: 'M-PESA • Receipts • Automation',
  },
  {
    slug: 'surviving-your-first-semester-away-from-home',
    title: 'Surviving Your First Semester Away From Home',
    description:
      'Real advice from students on budgeting, roommates, and settling into a new city and hostel.',
    category: 'campus-life',
    readTime: '6 min read',
    audienceLabel: 'For Students',
    tag: 'Campus Life',
    publishedAt: '2024-11-05',
    meta: 'Budgeting • Roommates • Wellbeing',
  },
];

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: 'Article not found | Rumi Blog',
      description: 'The article you are looking for could not be found.',
    };
  }

  return {
    title: `${post.title} | Rumi Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="mb-6 flex items-center gap-3 text-sm text-gray-500">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to all articles
            </Link>
          </div>
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Article not found
              </CardTitle>
              <CardDescription className="text-gray-600">
                The article you are looking for could not be found. It may have
                been moved or unpublished.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              <p className="mb-4">
                You can return to the blog home to explore other guides, product
                updates, and campus living tips.
              </p>
              <Button asChild size="sm" variant="default">
                <Link href="/blog">Go to blog</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const relatedPosts = posts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[#fafaf9] text-gray-900">
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to blog
            </Link>
            <span className="hidden sm:inline text-gray-300">/</span>
            <span className="hidden sm:inline truncate max-w-[220px] text-gray-500">
              {post.title}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Campus hostels
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-10 md:pt-16 pb-20 grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-10 lg:gap-16">
        <article className="lg:border-r lg:border-gray-100 lg:pr-10 xl:pr-14">
          <header className="mb-10">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
              <Badge
                variant="outline"
                className="border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-700"
              >
                {post.audienceLabel}
              </Badge>
              <Badge
                variant="outline"
                className="border-green-100 bg-green-50 text-[11px] font-medium text-green-700"
              >
                {post.tag}
              </Badge>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Students, landlords & caretakers
              </span>
            </div>

            <h1 className="mb-3 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-gray-900">
              {post.title}
            </h1>

            <p className="mb-4 text-base sm:text-lg text-gray-600 max-w-2xl">
              {post.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>
                Published {new Date(post.publishedAt).toLocaleDateString()}
              </span>
              {post.meta && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600">
                  {post.meta}
                </span>
              )}
            </div>
          </header>

          <div className="space-y-8 text-[15px] leading-relaxed text-gray-800">
            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                Why this matters
              </h2>
              <p>
                Rumi is built around real problems that students, landlords, and
                caretakers face every semester: unclear information, scattered
                communication, and stressful last-minute decisions. This article
                breaks those problems down into simple, repeatable steps that you
                can actually use.
              </p>
              <p>
                Use this as a practical playbook – something you can keep coming
                back to when you are evaluating a hostel, onboarding new
                tenants, or redesigning how your property is managed.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                Key ideas you will take away
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-800">
                <li>
                  How to move from gut-feel decisions to structured, data-backed
                  choices.
                </li>
                <li>
                  Where Rumi fits into your daily workflows – not as "another
                  app" but as part of how you run your hostel.
                </li>
                <li>
                  Simple systems you can set up in one afternoon, then let run
                  quietly in the background.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                A Notion-style, living document
              </h2>
              <p>
                Think of this page the way you would a Notion doc shared with
                your team: opinionated but editable in your mind. As Rumi
                evolves, the mental models in these guides stay the same – clear
                structure, transparent assumptions, and enough detail that you
                can make decisions without guessing.
              </p>
              <p>
                Many of our customers keep a private workspace where they adapt
                these checklists for their own properties, add notes from real
                tenant conversations, and track experiments over time.
              </p>
            </section>

            <section className="space-y-3 rounded-xl bg-yellow-50/60 border border-yellow-100 px-4 py-3 text-[14px] text-yellow-900">
              <h3 className="text-sm font-semibold tracking-tight">
                Make this actionable in under 15 minutes
              </h3>
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Create a quick Notion page or doc called "Rumi Playbook".</li>
                <li>
                  Copy the 3–5 bullet points from this article that resonate
                  most with your current situation.
                </li>
                <li>
                  Add one concrete action you will test this week – and who is
                  responsible.
                </li>
              </ol>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                How this connects to the rest of Rumi
              </h2>
              <p>
                Every feature in Rumi – from verified listings to M-PESA
                receipts – is designed to support the behaviours described here:
                transparent pricing, predictable cash flow, and safer student
                housing. If you are already using Rumi, treat this article as a
                strategy layer sitting above your daily dashboards.
              </p>
              <p>
                If you are not yet on Rumi, you can still use the frameworks in
                this guide to run a more disciplined, student-first hostel. The
                tools simply make it easier to keep everyone in sync.
              </p>
            </section>

            <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6 text-sm text-gray-500">
              <div className="flex flex-wrap items-center gap-2">
                <span>Share this guide</span>
                <span className="hidden sm:inline text-gray-300">•</span>
                <span className="text-gray-400">
                  Ideal for {post.audienceLabel.toLowerCase()}
                </span>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Link href="/blog" className="inline-flex items-center gap-2">
                  Back to more insights
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </footer>
          </div>
        </article>

        <aside className="lg:pt-4 space-y-6">
          <Card className="border-gray-200 bg-white/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Who this article is for
              </CardTitle>
              <CardDescription className="text-xs text-gray-600">
                A quick snapshot of the audience and context.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-gray-700">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-gray-900">Primary audience</span>
                <span>{post.audienceLabel}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-gray-900">Category</span>
                <span className="capitalize">{post.category.replace('-', ' ')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-gray-900">Reading time</span>
                <span>{post.readTime}</span>
              </div>
              {post.meta && (
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-900">Focus areas</span>
                  <span>{post.meta}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {relatedPosts.length > 0 && (
            <Card className="border-gray-200 bg-white/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">
                  Related articles
                </CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Continue exploring similar topics.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group block rounded-lg border border-transparent px-2 py-1.5 hover:border-gray-200 hover:bg-gray-50"
                  >
                    <p className="mb-1 text-xs font-semibold text-gray-900 group-hover:text-gray-950">
                      {related.title}
                    </p>
                    <p className="text-[11px] text-gray-600 line-clamp-2">
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
