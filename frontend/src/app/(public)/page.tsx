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
  title: 'Rumi - Student Hostel Management Platform Kenya',
  description:
    'Rental management platform for student hostels. Track rent payments, manage occupancy, handle tenant records. Replace WhatsApp and Excel with digital hostel operations.',
  openGraph: {
    title: 'Rumi - Student Hostel Management Platform',
    description:
      'Digital rental management for student hostels in Kenya. Rent tracking, M-PESA payments, occupancy management, and tenant records in one system.',
    url: 'https://rumi.co.ke',
    siteName: 'Rumi',
    images: [
      {
        url: '/og-image.png',
        alt: 'Rumi hostel management platform',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  keywords: [
    'student hostel management Kenya',
    'rental management system',
    'hostel operations software',
    'student housing management',
    'rent payment tracking',
    'occupancy management',
    'tenant management system',
    'hostel booking Kenya',
    'student accommodation Nairobi',
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
        className="relative border-b border-gray-200 bg-white"
        aria-label="Hero introduction"
      >
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Student Hostel Management Platform
            </h1>
            <p className="mb-8 text-xl text-gray-700 leading-relaxed">
              Digital rental management for student hostels. Track rent payments, manage occupancy, handle tenant records. Replace WhatsApp, Excel, and cash payments with dedicated hostel operations software.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/hostels" prefetch className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Search className="mr-2 h-5 w-5" />
                  View All Hostels
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
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                    List Property
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section
        className="py-16 bg-white border-b border-gray-200"
        aria-label="How it works"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              How Rumi Simplifies Hostel Management
            </h2>
            <div className="border border-gray-200 bg-gray-50">
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
        className="py-16 bg-white border-b border-gray-200"
        aria-label="How Rumi works"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-2xl font-bold text-gray-900">
              How Students Use Rumi
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
              {[
                {
                  number: '1',
                  title: 'Browse Hostels',
                  description:
                    'Search verified hostels by location and price.',
                },
                {
                  number: '2',
                  title: 'Book Room',
                  description: 'Pay rent via M-PESA. Instant confirmation.',
                },
                {
                  number: '3',
                  title: 'Track Payments',
                  description: 'View rent history and payment receipts.',
                },
                {
                  number: '4',
                  title: 'Manage Tenancy',
                  description: 'Request room transfers and view roommates.',
                },
              ].map(({ number, title, description }) => (
                <div
                  key={number}
                  className="flex flex-col items-start"
                >
                  <span className="mb-4 text-xl font-bold text-gray-900 border-b-2 border-gray-900 pb-1">
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
        className="py-16 bg-white border-b border-gray-200"
        aria-label="For students"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Badge
                className="mb-4 inline-flex border-gray-900 text-gray-900 rounded-none bg-transparent hover:bg-transparent"
                variant="outline"
            >
                STUDENTS
            </Badge>
            <h2 className="mb-8 text-3xl font-bold text-gray-900">
                For Students: Digital Rent Management
            </h2>
            {/* Features in compact grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  title: 'Digital Payments',
                  desc: 'Pay rent via M-PESA with instant digital receipts.',
                },
                {
                  title: 'Payment History',
                  desc: 'Access all rent payments and receipts in your dashboard.',
                },
                {
                  title: 'Room Management',
                  desc: 'Request room transfers and report maintenance issues.',
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
                  Search Hostels
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
        className="bg-gray-50 py-16 border-b border-gray-200"
        aria-label="For landlords"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
             <Badge
                className="mb-4 inline-flex border-gray-900 text-gray-900 rounded-none bg-transparent hover:bg-transparent"
                variant="outline"
            >
                LANDLORDS
            </Badge>
            <h2 className="mb-8 text-3xl font-bold text-gray-900">
              For Landlords: Operations Management
            </h2>
            {/* Features in compact grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  title: 'Rent Tracking',
                  desc: 'Track all rent payments, arrears, and payment status.',
                },
                {
                  title: 'Occupancy Management',
                  desc: 'Manage room occupancy, vacancies, and tenant records.',
                },
                {
                  title: 'Tenant Onboarding',
                  desc: 'Digital tenant registration and document management.',
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
                      Register Property
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
        className="py-16 bg-white"
        aria-label="Frequently asked questions"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-2xl font-bold text-gray-900">
              Questions
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
                  Verification Process
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  We physically inspect properties and verify ownership documents before listing.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="payments"
                className="border border-gray-200 px-4"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 no-underline hover:underline">
                  Payment Methods
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  M-PESA (Paybill/Till) only. Cash updates are not supported for initial booking security.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="cancellation"
                className="border border-gray-200 px-4"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 no-underline hover:underline">
                  Cancellation Policy
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Defined by individual landlords. See specific hostel page for details.
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
