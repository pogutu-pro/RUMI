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

export const metadata: Metadata = {
  title: 'Rumi - The Complete Platform for Student Housing in kenya',
  description:
    'Rumi connects listing, booking, and payments in one app. The complete student housing system for landlords and students in Kenya.',
  openGraph: {
    title: 'Rumi - The Complete Platform for Student Housing',
    description:
      'Manage student hostels with ease. Automated rent collection, bed-level bookings, and full operational control in one verified component.',
    url: 'https://rumi.co.ke',
    siteName: 'Rumi',
    images: [
      {
        url: '/og-image.png',
        alt: 'Rumi - Student Housing Platform',
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
        className="relative bg-white"
        aria-label="Hero introduction"
      >
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-primary sm:text-5xl">
              The Complete Platform for Student Housing in kenya
            </h1>
            <p className="mb-8 text-xl text-gray-700 leading-relaxed">
              Everything you need to list, book, and manage student hostels. One app for students, landlords, and caretakers.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/hostels" prefetch className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-none"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Find a Hostel
                </Button>
              </Link>
              <Link
                href={AUTH_ROUTES.REGISTER}
                prefetch
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Create Student Account
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
                  className="w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary/5 rounded-none"
                >
                    List Your Property
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section
        className="py-24 bg-white"
        aria-label="See Rumi in action"
      >
        <div className="container mx-auto px-0 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-6 text-2xl font-bold text-primary px-4 sm:px-0">
              See How Rumi Works
            </h2>
            <div className="border border-gray-200 bg-white overflow-hidden rounded-none shadow-sm">
                <RumiVideo
                url="https://www.youtube.com/watch?v=sBY5a0QZKUk"
                title="Rumi Hostel Management Demo"
                autoplay={false}
                muted
                loop={false}
                className=""
                />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="py-24 bg-white"
        aria-label="How Rumi works"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-2xl font-bold text-gray-900">
              Simple for Everyone
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
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
                  className="flex flex-col items-start p-6 bg-white"
                >
                  <span className="mb-4 text-2xl font-black text-primary">
                    {number}
                  </span>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {title}
                  </h3>
                  <p className="text-gray-700 text-sm">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Students */}
      <section
        className="py-24 bg-white"
        aria-label="For students"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Badge
                className="mb-4 inline-flex border-primary text-primary bg-primary/5 hover:bg-primary/10"
                variant="outline"
            >
                STUDENTS
            </Badge>
            <h2 className="mb-8 text-3xl font-bold text-primary">
                Campus Life Made Easy
            </h2>
            {/* Features in compact grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  title: 'Book Safely',
                  desc: 'Every hostel on Rumi is verified. No scams, no fake listings.',
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
                <div key={title} className="flex gap-3 items-start">
                  <CheckCircle2
                    className="mt-1 h-5 w-5 shrink-0 text-gray-900"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {title}
                    </h3>
                    <p className="text-gray-600 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-8">
              <Link href="/hostels" prefetch>
                  <Button size="lg">
                  Find a Hostel
                  </Button>
              </Link>
            </div>
            {/* Student Screenshots - larger, full width */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 bg-gray-50 p-2">
                <img src="/images/carousel/carousel-01.jpeg" alt="Student dashboard" className="w-full" />
              </div>
              <div className="border border-gray-200 bg-gray-50 p-2">
                <img src="/images/carousel/carousel-02.jpeg" alt="Rent payment interface" className="w-full" />
              </div>
              <div className="border border-gray-200 bg-gray-50 p-2 md:col-span-2">
                <img src="/images/carousel/carousel-03.jpeg" alt="Room booking" className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Landlords */}
      <section
        className="py-24 bg-white"
        aria-label="For landlords"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
             <Badge
                className="mb-4 inline-flex border-primary text-primary bg-primary/10 rounded-none"
                variant="outline"
            >
                LANDLORDS
            </Badge>
            <h2 className="mb-8 text-3xl font-bold text-gray-900 pr-6">
              Peace of Mind for Property Owners
            </h2>
            {/* Features in compact grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                <div key={title} className="flex gap-3 items-start">
                  <CheckCircle2
                    className="mt-1 h-5 w-5 shrink-0 text-gray-900"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {title}
                    </h3>
                    <p className="text-gray-600 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-8">
              <Link href={`${AUTH_ROUTES.REGISTER}?role=landlord`} prefetch>
                  <Button size="lg" variant="outline" className="bg-white">
                      List Your Property
                  </Button>
              </Link>
            </div>
            {/* Landlord Screenshots - larger, full width */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 bg-white p-2">
                <img src="/images/carousel/carousel-04.jpeg" alt="Landlord dashboard" className="w-full" />
              </div>
              <div className="border border-gray-200 bg-white p-2">
                <img src="/images/carousel/carousel-05.jpeg" alt="Property management" className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        className="py-24 bg-white"
        aria-label="Frequently asked questions"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-2xl font-bold text-primary">
              Questions & Answers
            </h2>
            <Accordion
              type="single"
              collapsible
              className="w-full space-y-4"
            >
              <AccordionItem
                value="booking"
                className="border border-gray-200 px-4"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 no-underline hover:underline">
                  How do I book a hostel?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Select a hostel, choose room type, and pay via M-PESA. You receive instant confirmation.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="verification"
                className="border border-gray-200 px-4"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 no-underline hover:underline">
                  Are the listings verified?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Yes. We physically inspect properties and verify ownership documents before they are listed.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="payments"
                className="border border-gray-200 px-4"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 no-underline hover:underline">
                  How does payment work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  We use M-PESA for secure, instant payments. You get a digital receipt immediately.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="cancellation"
                className="border border-gray-200 px-4"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 no-underline hover:underline">
                  What if I need to cancel?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Policies are set by individual landlords. Check the specific hostel page for details.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
             <div className="mt-8">
              <Link href="/faq" prefetch>
                <Button
                  variant="link"
                  className="pl-0 text-gray-900 underline"
                >
                  View All FAQs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
