import type { Metadata } from 'next';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animations/fade-in';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import {
  ArrowRight,
  UserPlus,
  Search,
  CreditCard,
  CheckCircle2,
  Users,
  Home,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how Rumi makes finding and managing student accommodation simple.',
};

const STUDENT_STEPS = [
  {
    number: '1',
    icon: <UserPlus className="h-8 w-8 text-green-600" />,
    title: 'Create Your Account',
    description:
      'Sign up as a student and complete your profile. Add your university, preferences, and budget.',
  },
  {
    number: '2',
    icon: <Search className="h-8 w-8 text-green-600" />,
    title: 'Search & Browse',
    description:
      'Use our advanced filters to find hostels near your campus. View photos, read reviews, and compare options.',
  },
  {
    number: '3',
    icon: <CreditCard className="h-8 w-8 text-green-600" />,
    title: 'Book & Pay',
    description:
      'Select your room, choose your move-in date, and pay securely with M-PESA. Get instant confirmation.',
  },
  {
    number: '4',
    icon: <CheckCircle2 className="h-8 w-8 text-green-600" />,
    title: 'Move In',
    description:
      'Receive all the details you need. Show up on your move-in date and start your campus journey!',
  },
];

const LANDLORD_STEPS = [
  {
    number: '1',
    icon: <UserPlus className="h-8 w-8 text-green-600" />,
    title: 'Register as Landlord',
    description:
      'Create your landlord account and verify your identity. This helps build trust with students.',
  },
  {
    number: '2',
    icon: <Home className="h-8 w-8 text-green-600" />,
    title: 'List Your Property',
    description:
      'Add photos, set pricing, describe amenities, and set availability. Our team will verify your listing.',
  },
  {
    number: '3',
    icon: <Users className="h-8 w-8 text-green-600" />,
    title: 'Receive Bookings',
    description:
      'Students can book your hostels instantly. You\'ll receive notifications and can manage everything in your dashboard.',
  },
  {
    number: '4',
    icon: <CreditCard className="h-8 w-8 text-green-600" />,
    title: 'Get Paid',
    description:
      'Receive payments directly through M-PESA. Track all transactions and earnings in your dashboard.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-white py-24 md:py-32">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              How It Works
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Simple, fast, and secure. Get started in just a few steps.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* For Students */}
      <section className="bg-white py-24 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                For Students
              </h2>
              <p className="text-lg text-gray-600">
                Find your perfect accommodation in four easy steps
              </p>
            </FadeIn>
            <FadeInStagger className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {STUDENT_STEPS.map((step, index) => (
                <FadeInItem key={step.number}>
                  <div className="relative h-full rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:shadow-lg">
                    <div className="mb-4 flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        {step.icon}
                      </div>
                    </div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                      {step.number}
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </FadeInItem>
              ))}
            </FadeInStagger>
            <FadeIn className="mt-12 text-center">
              <Link href="/hostels" prefetch>
                <Button size="lg" className="h-12 px-8">
                  Start Searching
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* For Landlords */}
      <section className="bg-gray-50 py-24 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                For Landlords
              </h2>
              <p className="text-lg text-gray-600">
                Start earning from your property in four simple steps
              </p>
            </FadeIn>
            <FadeInStagger className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {LANDLORD_STEPS.map((step, index) => (
                <FadeInItem key={step.number}>
                  <div className="relative h-full rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:shadow-lg">
                    <div className="mb-4 flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        {step.icon}
                      </div>
                    </div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                      {step.number}
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </FadeInItem>
              ))}
            </FadeInStagger>
            <FadeIn className="mt-12 text-center">
              <Link
                href={`${AUTH_ROUTES.REGISTER}?role=landlord`}
                prefetch
              >
                <Button size="lg" className="h-12 px-8">
                  List Your Property
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  );
}
