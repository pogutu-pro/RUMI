import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowRight, Search, CheckCircle2 } from 'lucide-react';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import RumiVideo from '@/components/ui/RumiVideo/rumivideo';
import { RumiaLogoLabel3D } from '@/components/ui/rumia-logo-label';
import { WordSwitcher } from '@/components/animations/word-switcher';

export const metadata: Metadata = {
  title: 'Rumia - The Complete Platform for Student Housing in Kenya',
  description:
    'Rumia connects listing, booking, and payments in one app. The complete student housing system for landlords and students in Kenya.',
  openGraph: {
    title: 'Rumia - The Complete Platform for Student Housing',
    description:
      'Manage student hostels with ease. Automated rent collection, bed-level bookings, and full operational control in one verified component.',
    url: 'https://rumia.co.ke',
    siteName: 'Rumia',
    images: [
      {
        url: '/og-image.png',
        alt: 'Rumia - Student Housing Platform',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  keywords: [
    'student housing platform',
    'hostel management system Kenya',
    'student accommodation software',
    'hostel booking app',
    'university housing Kenya',
    'automated rent collection',
    'M-PESA rent payment',
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <main className="flex flex-col bg-white text-gray-900 font-sans">
      {/* Hero Section */}
      <section
        className="relative min-h-[65vh] lg:min-h-[80vh] flex items-center overflow-hidden bg-white pt-20 pb-16 lg:pt-28 lg:pb-24"
        aria-label="Hero introduction"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
            
            {/* Subtle Brand Indicator (Antigravity Style) */}
            <div className="mb-10 flex items-center gap-2 animate-fade-in">
              <RumiaLogoLabel3D className="h-8 w-auto" />
            </div>

            {/* Headline */}
            <h1 className="mb-10 text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl lg:text-8xl xl:text-9xl leading-[1.1] animate-slide-up">
              <span className="block mb-2">The Complete Platform for</span>
              <span className="text-primary block">
                <WordSwitcher 
                  words={['Student Housing', 'Hostel Booking', 'Smart Living']} 
                  className="min-w-[1em]"
                />
              </span>
            </h1>

            {/* Subtext */}
            <p className="mb-12 text-lg lg:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto animate-slide-up [animation-delay:150ms]">
              Everything you need to list, book, and manage student hostels in Kenya. 
              One app for students, landlords, and caretakers.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up [animation-delay:300ms] w-full sm:w-auto">
              <Link href="/hostels" prefetch className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white rounded-full h-14 px-8 text-lg font-medium shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                >
                  Find a Hostel
                </Button>
              </Link>
              <Link
                href={`${AUTH_ROUTES.REGISTER}?role=landlord`}
                prefetch
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-gray-100 rounded-full h-14 px-8 text-lg font-medium transition-all hover:scale-[1.02] active:scale-95"
                >
                    List Your Property
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Refined Background Texture */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.015] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary/[0.03] rounded-full blur-[120px] -z-10" />
        </div>
      </section>

      {/* Platform Overview */}
      <section
        className="py-20 lg:py-32 bg-gray-50/50"
        aria-label="See Rumia in action"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center mb-16">
            <h2 className="mb-6 text-3xl lg:text-5xl font-bold text-primary">
              See How Rumia Works
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
              A quick walkthrough of how we're revolutionizing student housing in Kenya.
            </p>
          </div>
          <div className="mx-auto max-w-5xl">
            <div className="relative border-8 border-white bg-white overflow-hidden rounded-[2rem] shadow-2xl">
                <RumiVideo
                url="https://www.youtube.com/watch?v=sBY5a0QZKUk"
                title="Rumia Hostel Management Demo"
                autoplay={false}
                muted
                loop={false}
                className="aspect-video"
                />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="py-20 lg:py-32 bg-white"
        aria-label="How Rumia works"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="mb-6 text-3xl lg:text-5xl font-bold text-gray-900">
                Simple for Everyone
              </h2>
              <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
                Our platform is designed to be intuitive and powerful for all users.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  number: '1',
                  title: 'Verified Listings',
                  description:
                    'Browse hostels that have been checked and verified.',
                },
                {
                  number: '2',
                  title: 'M-PESA Payment',
                  description: 'Pay rent instantly and get a digital receipt.',
                },
                {
                  number: '3',
                  title: 'Manage Your Stay',
                  description: 'Track payments and request room repairs anytime.',
                },
                {
                  number: '4',
                  title: 'Total Control',
                  description: 'For landlords: see payments, vacancies, and issues.',
                },
              ].map(({ number, title, description }) => (
                <div
                  key={number}
                  className="flex flex-col items-center text-center p-8 bg-gray-50 rounded-3xl transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1 duration-300"
                >
                  <span className="mb-6 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-2xl font-black text-primary">
                    {number}
                  </span>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    {title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Students */}
      <section
        className="py-20 lg:py-32 bg-gray-50/50"
        aria-label="For students"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge
                    className="mb-6 inline-flex px-4 py-1.5 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 rounded-full font-bold tracking-wider"
                    variant="outline"
                >
                    STUDENTS
                </Badge>
                <h2 className="mb-6 text-4xl lg:text-5xl font-bold text-primary leading-tight">
                    Campus Life Made Easy
                </h2>
                <p className="mb-10 text-lg lg:text-xl text-gray-600 leading-relaxed">
                  Focus on your studies while we take care of your housing needs. Find, book, and manage your stay with a few taps.
                </p>
                {/* Features in compact grid */}
                <div className="space-y-6 mb-10">
                  {[
                    {
                      title: 'Book Safely',
                      desc: 'Every hostel on Rumia is verified. No scams, no fake listings.',
                    },
                    {
                      title: 'Pay Easily',
                      desc: 'Pay rent directly via M-PESA. No need to visit the bank.',
                    },
                    {
                      title: 'Live Better',
                      desc: 'Report maintenance issues and manage your room from your phone.',
                    },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex gap-4 items-start p-4 bg-white rounded-2xl shadow-sm">
                      <div className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 shrink-0">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {title}
                        </h3>
                        <p className="text-gray-600">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <Link href="/hostels" prefetch>
                      <Button size="lg" className="rounded-xl h-14 px-8 text-lg font-bold">
                        Find a Hostel
                      </Button>
                  </Link>
                </div>
              </div>

              {/* Student Screenshots */}
              <div className="grid grid-cols-2 gap-4 relative">
                <div className="space-y-4 pt-12">
                  <div className="border-4 border-white bg-white rounded-3xl shadow-xl overflow-hidden transform -rotate-3">
                    <img src="/images/carousel/carousel-01.jpeg" alt="Student dashboard" className="w-full" />
                  </div>
                  <div className="border-4 border-white bg-white rounded-3xl shadow-xl overflow-hidden transform rotate-2">
                    <img src="/images/carousel/carousel-02.jpeg" alt="Rent payment interface" className="w-full" />
                  </div>
                </div>
                <div className="pt-0">
                  <div className="border-4 border-white bg-white rounded-3xl shadow-xl overflow-hidden transform rotate-3 h-full flex items-center">
                    <img src="/images/carousel/carousel-03.jpeg" alt="Room booking" className="w-full h-full object-cover" />
                  </div>
                </div>
                {/* Background blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Landlords */}
      <section
        className="py-20 lg:py-32 bg-white"
        aria-label="For landlords"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 grid grid-cols-2 gap-4 relative">
                <div className="space-y-4">
                  <div className="border-4 border-white bg-gray-50 rounded-3xl shadow-xl overflow-hidden transform -rotate-2">
                    <img src="/images/carousel/carousel-04.jpeg" alt="Landlord dashboard" className="w-full" />
                  </div>
                </div>
                <div className="pt-12">
                  <div className="border-4 border-white bg-gray-50 rounded-3xl shadow-xl overflow-hidden transform rotate-3">
                    <img src="/images/carousel/carousel-05.jpeg" alt="Property management" className="w-full" />
                  </div>
                </div>
                {/* Background blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
              </div>

              <div className="order-1 lg:order-2">
                 <Badge
                    className="mb-6 inline-flex px-4 py-1.5 border-primary/20 text-primary bg-primary/10 rounded-full font-bold tracking-wider"
                    variant="outline"
                >
                    LANDLORDS
                </Badge>
                <h2 className="mb-6 text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Peace of Mind for Property Owners
                </h2>
                <p className="mb-10 text-lg lg:text-xl text-gray-600 leading-relaxed">
                  Automate your operations and maximize your occupancy. Rumia gives you the tools to manage your properties from anywhere.
                </p>
                {/* Features in compact grid */}
                <div className="space-y-6 mb-10">
                  {[
                    {
                      title: 'Get Paid on Time',
                      desc: 'Automated rent tracking and reminders. Know who owes what.',
                    },
                    {
                      title: 'Fill Your Rooms',
                      desc: 'Get seen by thousands of verified students looking for housing.',
                    },
                    {
                      title: 'Control Everything',
                      desc: 'Manage occupancy, caretakers, and property issues in one place.',
                    },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex gap-4 items-start p-4 bg-gray-50 rounded-2xl">
                      <div className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary shrink-0">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {title}
                        </h3>
                        <p className="text-gray-600">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <Link href={`${AUTH_ROUTES.REGISTER}?role=landlord`} prefetch>
                      <Button size="lg" variant="outline" className="rounded-xl h-14 px-8 text-lg font-bold border-2 border-primary text-primary hover:bg-primary/5">
                          List Your Property
                      </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        className="py-20 lg:py-32 bg-gray-50/30"
        aria-label="Frequently asked questions"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="mb-6 text-3xl lg:text-5xl font-bold text-primary">
                Questions & Answers
              </h2>
              <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about using Rumia.
              </p>
            </div>
            <Accordion
              type="single"
              collapsible
              className="w-full space-y-4"
            >
              {[
                {
                  value: 'booking',
                  q: 'How do I book a hostel?',
                  a: 'Select a hostel, choose room type, and pay via M-PESA. You receive instant confirmation.'
                },
                {
                  value: 'verification',
                  q: 'Are the listings verified?',
                  a: 'Yes. We physically inspect properties and verify ownership documents before they are listed.'
                },
                {
                  value: 'payments',
                  q: 'How does payment work?',
                  a: 'We use M-PESA for secure, instant payments. You get a digital receipt immediately.'
                },
                {
                  value: 'cancellation',
                  q: 'What if I need to cancel?',
                  a: 'Policies are set by individual landlords. Check the specific hostel page for details.'
                }
              ].map((item) => (
                <AccordionItem
                  key={item.value}
                  value={item.value}
                  className="border border-gray-200 bg-white rounded-2xl px-6 py-2 shadow-sm data-[state=open]:shadow-md transition-all"
                >
                  <AccordionTrigger className="text-left font-bold text-lg text-gray-900 no-underline hover:no-underline py-4">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-lg pb-4 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
             <div className="mt-12 text-center">
              <Link href="/faq" prefetch>
                <Button
                  variant="link"
                  className="text-primary font-bold text-lg hover:underline decoration-2 underline-offset-4"
                >
                  View All FAQs
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
