import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Clock, MapPin, Users } from 'lucide-react';
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

export const metadata: Metadata = {
  title: 'Blog - Insights for Students, Landlords & Caretakers',
  description:
    'Discover guides, product updates, and campus living tips to help students, landlords, and caretakers get the most out of Rumi.',
};

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

const filters: { id: BlogCategory; label: string }[] = [
  { id: 'all', label: 'All posts' },
  { id: 'students', label: 'For Students' },
  { id: 'landlords', label: 'For Landlords' },
  { id: 'caretakers', label: 'For Caretakers' },
  { id: 'product', label: 'Product & Platform' },
  { id: 'campus-life', label: 'Campus Life' },
];

export default function BlogPage() {
  const activeFilter: BlogCategory = 'all';
  const visiblePosts =
    activeFilter === 'all'
      ? posts
      : posts.filter((post) => post.category === activeFilter);

  const [featured, ...rest] = visiblePosts;

  return (
    <main className="flex flex-col bg-white text-gray-900">
      <section className="border-b border-gray-100">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 md:pt-28 md:pb-16">
          <div className="mx-auto max-w-4xl">
            <Badge
              variant="outline"
              className="mb-5 inline-flex items-center gap-2 border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-medium text-gray-700"
            >
              Rumi Blog
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Insights for better
              <br />
              campus living.
            </h1>
            <p className="mb-8 text-lg text-gray-600 sm:text-xl max-w-2xl">
              Guides, stories, and product updates for students, landlords, and
              caretakers building safer, better managed hostels with Rumi.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <div className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                For students, landlords & caretakers
              </div>
              <div className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                Focused on campus hostels
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="border-b border-gray-100 bg-gray-50/60">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const is_active = filter.id === activeFilter;
                return (
                  <Button
                    key={filter.id}
                    size="sm"
                    variant={is_active ? 'default' : 'outline'}
                    className="rounded-full px-4"
                    aria-pressed={is_active}
                  >
                    {filter.label}
                  </Button>
                );
              })}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              Showing {visiblePosts.length} curated articles
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {featured && (
            <FadeIn className="mb-12 md:mb-16">
              <Link href={`/blog/${featured.slug}`}>
                <Card className="grid gap-8 overflow-hidden border-gray-200 bg-gradient-to-r from-white to-gray-50 p-6 transition-all hover:border-gray-300 hover:shadow-lg md:grid-cols-[2fr,1.2fr] md:p-8">
                  <div className="flex flex-col justify-between space-y-4">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                        <Badge
                          variant="outline"
                          className="border-gray-200 bg-white/80 text-xs font-medium text-gray-700"
                        >
                          {featured.audienceLabel}
                        </Badge>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {featured.readTime}
                        </span>
                      </div>
                      <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                        {featured.title}
                      </h2>
                      <p className="mb-4 text-sm text-gray-600 sm:text-base">
                        {featured.description}
                      </p>
                      {featured.meta && (
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          {featured.meta}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="elevated"
                      size="sm"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                      className="mt-4 w-fit"
                    >
                      Read article
                    </Button>
                  </div>
                  <div className="flex flex-col justify-between border-t border-gray-100 pt-4 text-sm text-gray-500 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="border-green-100 bg-green-50 text-[11px] font-medium text-green-700"
                      >
                        {featured.tag}
                      </Badge>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium">
                        Published{' '}
                        {new Date(featured.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-4 text-xs leading-relaxed text-gray-500">
                      Learn how Rumi fits into real campus life scenarios – from
                      first-year students looking for a safe place to landlords
                      building sustainable businesses.
                    </p>
                  </div>
                </Card>
              </Link>
            </FadeIn>
          )}

          <section aria-label="All blog articles">
            <FadeIn className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                Latest from the blog
              </h2>
              <span className="text-xs sm:text-sm text-gray-500">
                Browse practical guides and product updates
              </span>
            </FadeIn>
            <FadeInStagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <FadeInItem key={post.slug}>
                  <Link href={`/blog/${post.slug}`}>
                    <Card
                      className="flex h-full flex-col justify-between border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-md"
                      isInteractive
                    >
                      <CardHeader className="space-y-3 pb-4">
                        <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                          <Badge
                            variant="outline"
                            className="border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-700"
                          >
                            {post.audienceLabel}
                          </Badge>
                          <div className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {post.readTime}
                          </div>
                        </div>
                        <CardTitle className="text-base sm:text-lg">
                          {post.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          {post.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-green-100 bg-green-50 text-[11px] font-medium text-green-700"
                          >
                            {post.tag}
                          </Badge>
                          <span>
                            Published{' '}
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {post.meta && (
                          <p className="leading-relaxed text-gray-500">
                            {post.meta}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </FadeInItem>
              ))}
            </FadeInStagger>
          </section>
        </div>
      </section>
    </main>
  );
}
