import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowRight,
  Search,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  FadeIn,
  FadeInStagger,
  FadeInItem,
} from '@/components/animations/fade-in';
import { AnimatedCounterGrid } from '@/components/animations/animated-counter';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import RumiVideo from '@/components/ui/RumiVideo/rumivideo';
import { PlatformCarousel } from '@/components/ui/platform-carousel';

export const metadata: Metadata = {
  title: 'Rumi - Your Campus Accommodation, Simplified',
  description:
    'Find verified campus hostels with safe bookings and trusted landlords. Rumi makes student housing simple.',
  openGraph: {
    title: 'Rumi - Your Campus Life, Simplified',
    description:
      'Find verified campus hostels with safe bookings and trusted landlords. Rumi makes student housing simple.',
    url: 'https://rumi.co.ke',
    siteName: 'Rumi',
    images: [
      {
        url: '/og-image.png',
        alt: 'Rumi student accommodation platform',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  keywords: [
    'student accommodation Kenya',
    'campus hostels Nairobi',
    'verified student housing',
    'hostel booking platform',
    'university rentals',
    'affordable student apartments',
    'M-PESA payments hostels',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function HomePage() {
  return (
    <main className="flex flex-col bg-white text-gray-900 antialiased">
      {/* Hero Section - Optimized for SEO with h1 */}
      <section
        className="relative overflow-hidden bg-white"
        aria-label="Hero introduction"
      >
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 xs:pt-24 xs:pb-28 md:pt-32 md:pb-40">
          <div className="mx-auto max-w-4xl text-center">
            <Badge
              className="mb-6 xs:mb-8 inline-flex items-center gap-2 border-gray-200 bg-gray-50 px-3 py-1.5 xs:px-4 text-xs xs:text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              variant="outline"
            >
              <Sparkles className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
              Trusted by all landlords and students
            </Badge>
            <h1 className="mb-5 xs:mb-6 text-4xl xs:text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl md:text-7xl lg:text-8xl">
              Your Accommodation,
              <br />
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Simplified
              </span>
            </h1>
            <p className="mb-8 xs:mb-10 text-lg xs:text-xl text-gray-600 sm:text-2xl max-w-2xl mx-auto leading-relaxed">
              Find verified hostels, connect with trusted landlords, and book
              accommodation with confidence — all in one easy platform.
            </p>
            <div className="flex flex-col gap-3 xs:gap-4 sm:flex-row sm:justify-center">
              <Link href="/hostels" prefetch className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 xs:h-14 px-6 xs:px-8 text-sm xs:text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  aria-label="Find hostels"
                >
                  <Search className="mr-2 h-4 w-4 xs:h-5 xs:w-5" />
                  Find Hostels
                </Button>
              </Link>
              <Link href={AUTH_ROUTES.REGISTER} prefetch className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="charcoal"
                  className="w-full sm:w-auto h-12 xs:h-14 px-6 xs:px-8 text-sm xs:text-base"
                  aria-label="Get started"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 xs:h-5 xs:w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Social Proof / Stats - Animated counters for live feel */}
      <section
        className="border-y border-gray-100 bg-gray-50/50 py-12 xs:py-16 md:py-20"
        aria-label="Platform statistics"
      >
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <AnimatedCounterGrid
              stats={[
                { value: '10,000+', label: 'Active Students' },
                { value: '500+', label: 'Verified Hostels' },
                { value: '98%', label: 'Satisfaction Rate' },
                { value: '24/7', label: 'Support Available' },
              ]}
            />
          </div>
        </FadeIn>
      </section>

      {/* Why Rumi? - Replaced with Video Section */}
      <section className="py-16 xs:py-20 md:py-24 lg:py-32 bg-white" aria-label="Why choose Rumi">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="mb-6 xs:mb-8 text-3xl xs:text-4xl font-bold text-gray-900 sm:text-5xl">
              Why Rumi?
            </h2>
            <RumiVideo
              url="https://www.youtube.com/watch?v=sBY5a0QZKUk"
              title="Why Choose Rumi - Platform Overview"
              autoplay
              muted
              loop
              className="shadow-2xl"
            />
          </div>
        </FadeIn>
      </section>

      {/* Dashboard Preview / Core USP - Replaced icons with real dashboard previews */}
      <section
        className="bg-gray-50 py-16 xs:py-20 md:py-24 lg:py-32"
        aria-label="Platform dashboards preview"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-12 xs:mb-16 text-center">
              <h2 className="mb-3 xs:mb-4 text-3xl xs:text-4xl font-bold text-gray-900 sm:text-5xl">
                Your Dashboards, Simplified
              </h2>
              <p className="text-lg text-gray-600">
                Everything you need, right where you need it
              </p>
            </FadeIn>
            <FadeInStagger>
              <PlatformCarousel
                slides={[
                  {
                    src: '/images/dashboards/student-dashboard.png',
                    alt: 'Rumi Student Dashboard preview',
                    title: 'Student Dashboard',
                    description:
                      'View booking history, manage your profile, and track payments all in one place.',
                  },
                  {
                    src: '/images/dashboards/landlord-dashboard.png',
                    alt: 'Rumi Landlord Dashboard preview',
                    title: 'Landlord Dashboard',
                    description:
                      'Manage your listings, bookings, and earnings. Grow your business by reaching thousands of students.',
                  },
                  {
                    src: '/images/dashboards/caretaker-dashboard.png',
                    alt: 'Rumi Caretaker Dashboard preview',
                    title: 'Caretaker Dashboard',
                    description:
                      'Organize tasks and oversee hostel property management efficiently with powerful tools.',
                  },
                ]}
                autoPlayInterval={5000}
              />
            </FadeInStagger>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 xs:py-20 md:py-24 lg:py-32 bg-white" aria-label="How Rumi works">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <FadeIn className="mb-12 xs:mb-16 text-center">
              <h2 className="mb-3 xs:mb-4 text-3xl xs:text-4xl font-bold text-gray-900 sm:text-5xl">
                How It Works
              </h2>
              <p className="text-lg text-gray-600">
                Get started in four simple steps
              </p>
            </FadeIn>
            <FadeInStagger className="grid gap-8 xs:gap-10 sm:gap-12 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
              {[
                {
                  number: '1',
                  title: 'Sign Up & Create Profile',
                  description:
                    'Register to access your personalized dashboard.',
                },
                {
                  number: '2',
                  title: 'Discover or Manage Hostels',
                  description: 'Search as a student or manage as a landlord.',
                },
                {
                  number: '3',
                  title: 'Make or Receive Bookings',
                  description: 'Use secure M-PESA payments and booking system.',
                },
                {
                  number: '4',
                  title: 'Track Activity & Payments',
                  description: 'Stay updated with your transactions and tasks.',
                },
              ].map(({ number, title, description }) => (
                <FadeInItem
                  key={number}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
                    {number}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900">
                    {title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{description}</p>
                </FadeInItem>
              ))}
            </FadeInStagger>
          </div>
        </div>
      </section>

      {/* Platform Benefits - Modern Carousel */}
      <section
        className="bg-gray-50 py-16 xs:py-20 md:py-24 lg:py-32"
        aria-label="Platform benefits showcase"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-12 xs:mb-16 text-center">
              <h2 className="mb-3 xs:mb-4 text-3xl xs:text-4xl font-bold text-gray-900 sm:text-5xl">
                Platform Benefits
              </h2>
              <p className="text-lg text-gray-600">
                Experience the best of student accommodation
              </p>
            </FadeIn>
            <FadeIn>
              <PlatformCarousel
                slides={[
                  {
                    src: '/images/carousel/carousel-01.png',
                    alt: 'Verified and trustworthy hostels',
                    title: 'Verified & Trustworthy',
                    description: 'All hostels are verified for legitimacy and safety',
                  },
                  {
                    src: '/images/carousel/carousel-02.jpg',
                    alt: 'Easy dashboard management',
                    title: 'Easy Dashboard',
                    description: 'User-centric dashboards for effortless management',
                  },
                  {
                    src: '/images/carousel/carousel-03.png',
                    alt: 'Mobile friendly design',
                    title: 'Mobile Friendly',
                    description: 'Fully responsive design that works great on any device',
                  },
                  {
                    src: '/images/carousel/carousel-04.png',
                    alt: 'Secure M-PESA payments',
                    title: 'Secure M-PESA Payments',
                    description: 'Safe and instant payments without the hassle',
                  },
                ]}
                autoPlayInterval={5000}
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Students Section - Video on the right (desktop) */}
      <section className="py-16 xs:py-20 md:py-24 lg:py-32 bg-white" aria-label="For students">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 md:gap-16 lg:grid-cols-2 lg:items-center">
              {/* Left Column - Content */}
              <FadeIn>
                <Badge
                  className="mb-6 inline-flex border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-medium text-gray-700"
                  variant="outline"
                >
                  For Students
                </Badge>
                <h2 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">
                  Your Journey Starts Here
                </h2>
                <div className="mb-10 space-y-6 text-gray-700">
                  {[
                    {
                      title: 'Safe & Secure',
                      desc: 'All hostels are verified with proper licenses and safety standards.',
                    },
                    {
                      title: 'Student-Friendly',
                      desc: 'Close to universities, affordable prices, and flexible terms.',
                    },
                    {
                      title: 'Community First',
                      desc: 'Connect with other students and build lasting friendships.',
                    },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex gap-4 items-start">
                      <CheckCircle2
                        className="mt-1 h-6 w-6 shrink-0 text-green-600"
                        aria-hidden="true"
                      />
                      <div>
                        <h3 className="mb-1 text-lg font-semibold text-gray-900">
                          {title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/hostels" prefetch>
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-semibold"
                    aria-label="Start searching hostels"
                  >
                    Start Searching
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </FadeIn>
              
              {/* Right Column - Video */}
              <FadeIn className="lg:order-last">
                <div className="w-full max-w-3xl mx-auto lg:mx-0">
                  <RumiVideo
                    url="https://www.youtube.com/watch?v=sBY5a0QZKUk"
                    title="Student Experience on Rumi"
                    autoplay
                    muted
                    loop
                    className="shadow-2xl"
                  />
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Landlords Section - Video on the right (desktop) */}
      <section className="bg-gray-50 py-16 xs:py-20 md:py-24 lg:py-32" aria-label="For landlords">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 md:gap-16 lg:grid-cols-2 lg:items-center">
              {/* Left Column - Content */}
              <FadeIn>
                <Badge
                  className="mb-6 inline-flex border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700"
                  variant="outline"
                >
                  For Landlords
                </Badge>
                <h2 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">
                  Grow Your Business
                </h2>
                <div className="mb-10 space-y-6 text-gray-700">
                  {[
                    {
                      title: 'Reach More Students',
                      desc: 'List your property and connect with thousands of students looking for accommodation.',
                    },
                    {
                      title: 'Easy Management',
                      desc: 'Manage bookings, payments, and communications all in one place.',
                    },
                    {
                      title: 'Secure Payments',
                      desc: 'Get paid instantly through M-PESA with zero hassle.',
                    },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex gap-4 items-start">
                      <CheckCircle2
                        className="mt-1 h-6 w-6 shrink-0 text-green-600"
                        aria-hidden="true"
                      />
                      <div>
                        <h3 className="mb-1 text-lg font-semibold text-gray-900">
                          {title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href={`${AUTH_ROUTES.REGISTER}?role=landlord`} prefetch>
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-semibold"
                    aria-label="List your property"
                  >
                    List Your Property
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </FadeIn>
              
              {/* Right Column - Video */}
              <FadeIn className="lg:order-last">
                <div className="w-full max-w-3xl mx-auto lg:mx-0">
                  <RumiVideo
                    url="https://www.youtube.com/watch?v=sBY5a0QZKUk"
                    title="Landlord Experience on Rumi"
                    autoplay
                    muted
                    loop
                    className="shadow-2xl"
                  />
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section
        className="py-16 xs:py-20 md:py-24 lg:py-32 bg-white"
        aria-label="Frequently asked questions preview"
      >
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600">
                Got questions? We have got answers.
              </p>
            </div>
            <Accordion
              type="single"
              collapsible
              className="w-full space-y-4"
              role="list"
              aria-label="FAQ list"
            >
              <AccordionItem
                value="booking"
                role="listitem"
                className="rounded-lg border border-gray-200 px-6"
              >
                <AccordionTrigger className="text-left font-semibold">
                  How do I book a hostel?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Simply browse our listings, select your preferred hostel,
                  choose your room type, and complete the booking with M-PESA.
                  You will receive instant confirmation and can move in on your
                  selected date.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="verification"
                role="listitem"
                className="rounded-lg border border-gray-200 px-6"
              >
                <AccordionTrigger className="text-left font-semibold">
                  Are all hostels verified?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Yes! Every hostel on Rumi undergoes a verification process. We
                  check licenses, visit the property, verify photos, and ensure
                  safety standards are met before listing.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="payments"
                role="listitem"
                className="rounded-lg border border-gray-200 px-6"
              >
                <AccordionTrigger className="text-left font-semibold">
                  What payment methods do you accept?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  We currently accept M-PESA payments for instant booking. All
                  transactions are secure and you will receive a payment
                  confirmation immediately.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="cancellation"
                role="listitem"
                className="rounded-lg border border-gray-200 px-6"
              >
                <AccordionTrigger className="text-left font-semibold">
                  Can I cancel my booking?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Cancellation policies vary by hostel. Most offer free
                  cancellation up to 7 days before move-in. Check the specific
                  hostel cancellation policy on their listing page.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="mt-12 text-center">
              <Link href="/faq" prefetch>
                <Button
                  variant="charcoal"
                  size="lg"
                  className="h-12 px-8"
                  aria-label="View all frequently asked questions"
                >
                  View All FAQs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* CTA Section */}
      <section
        className="bg-gradient-to-br from-green-600 to-emerald-600 py-16 xs:py-20 md:py-24 lg:py-32"
        aria-label="Call to action"
      >
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
              Ready to Get Started?
            </h2>
            <p className="mb-10 text-xl text-green-50">
              Join thousands of students and landlords already using Rumi
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/hostels" prefetch>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14 px-8 text-base font-semibold bg-white text-green-600 hover:bg-gray-50"
                  aria-label="Find hostels"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Find Hostels
                </Button>
              </Link>
              <Link href={AUTH_ROUTES.REGISTER} prefetch>
                <Button
                  size="lg"
                  variant="charcoal"
                  className="h-14 px-8 text-base"
                  aria-label="Get started"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
