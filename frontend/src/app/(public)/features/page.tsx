import type { Metadata } from 'next';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animations/fade-in';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import {
  Shield,
  Zap,
  Users,
  Home,
  CreditCard,
  Search,
  Bell,
  MapPin,
  Star,
  MessageSquare,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Discover all the features that make Rumi the best platform for student accommodation.',
};

const FEATURES = [
  {
    category: 'For Students',
    items: [
      {
        icon: <Search className="h-8 w-8 text-green-600" />,
        title: 'Advanced Search',
        description:
          'Filter by location, price, amenities, and more. Find your perfect hostel in seconds.',
      },
      {
        icon: <Shield className="h-8 w-8 text-green-600" />,
        title: 'Verified Listings',
        description:
          'Every hostel is verified for safety and legitimacy. No fake listings, no scams.',
      },
      {
        icon: <CreditCard className="h-8 w-8 text-green-600" />,
        title: 'Secure Payments',
        description:
          'Pay safely with M-PESA. All transactions are encrypted and secure.',
      },
      {
        icon: <Star className="h-8 w-8 text-green-600" />,
        title: 'Reviews & Ratings',
        description:
          'Read reviews from other students and make informed decisions.',
      },
      {
        icon: <Bell className="h-8 w-8 text-green-600" />,
        title: 'Booking Alerts',
        description:
          'Get notified when new hostels match your preferences or when prices drop.',
      },
    ],
  },
  {
    category: 'For Landlords',
    items: [
      {
        icon: <Home className="h-8 w-8 text-green-600" />,
        title: 'Easy Listing',
        description:
          'List your property in minutes with our simple, intuitive interface.',
      },
      {
        icon: <TrendingUp className="h-8 w-8 text-green-600" />,
        title: 'Reach More Students',
        description:
          'Connect with thousands of students actively looking for accommodation.',
      },
      {
        icon: <Users className="h-8 w-8 text-green-600" />,
        title: 'Booking Management',
        description:
          'Manage all your bookings and availability in one dashboard.',
      },
      {
        icon: <CreditCard className="h-8 w-8 text-green-600" />,
        title: 'Fast Payouts',
        description:
          'Receive payments quickly through M-PESA. Track all transactions easily.',
      },
      {
        icon: <MapPin className="h-8 w-8 text-green-600" />,
        title: 'Analytics Dashboard',
        description:
          'Track your performance, view booking trends, and optimize your listings.',
      },
      {
        icon: <Zap className="h-8 w-8 text-green-600" />,
        title: 'Automated Reminders',
        description:
          'Never miss a booking with automated reminders and notifications.',
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-white py-24 md:py-32">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Powerful Features
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Everything you need to find or manage student accommodation, all in
              one platform.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Features Sections */}
      {FEATURES.map((section, sectionIndex) => (
        <section
          key={section.category}
          className={sectionIndex % 2 === 0 ? 'bg-white py-24 md:py-32' : 'bg-gray-50 py-24 md:py-32'}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <FadeIn className="mb-12 text-center">
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  {section.category}
                </h2>
              </FadeIn>
              <FadeInStagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {section.items.map((feature, index) => (
                  <FadeInItem key={feature.title}>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:border-gray-300">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
                        {feature.icon}
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </FadeInItem>
                ))}
              </FadeInStagger>
            </div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-600 py-24 md:py-32">
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
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
