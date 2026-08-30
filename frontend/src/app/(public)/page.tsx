import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle2,
  Home,
  Users,
  Receipt,
  Wallet,
  ShieldCheck,
  Zap,
  LayoutGrid,
} from 'lucide-react';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { WordSwitcher } from '@/components/animations/word-switcher';

export const metadata: Metadata = {
  title: 'RumiaRent - Rental Management for Kenyan Landlords',
  description:
    'RumiaRent helps Kenyan landlords and agents manage properties, track tenants, and collect rent. Simple enough to start using today.',
  openGraph: {
    title: 'RumiaRent - Rental Management for Kenyan Landlords',
    description:
      'Properties, units, tenants, rent, and payments in one simple place. Know who owes you, get paid via Paystack or cash, and see what needs attention.',
    url: 'https://rumiarent.co.ke',
    siteName: 'RumiaRent',
    images: [
      {
        url: '/og-image.png',
        alt: 'RumiaRent - Rental Management Platform',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  keywords: [
    'rental management Kenya',
    'landlord software Kenya',
    'property management system Kenya',
    'rent collection app',
    'Paystack rent payment',
    'tenant management software',
  ],
  robots: {
    index: true,
    follow: true,
  },
};

const DASHBOARD_STATS = [
  { label: 'Properties', value: '4', icon: Home },
  { label: 'Occupied units', value: '19 / 22', icon: Users },
  { label: 'Outstanding rent', value: 'KES 84,000', icon: Receipt },
  { label: 'Collected this month', value: 'KES 412,000', icon: Wallet },
];

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Always know who owes you',
    desc: 'Every tenant, every charge, current balance. Updated the moment a payment lands.',
  },
  {
    icon: Zap,
    title: 'Get paid without chasing',
    desc: 'Tenants pay via Paystack, or you record cash and bank payments in a tap.',
  },
  {
    icon: LayoutGrid,
    title: 'One login, every property',
    desc: 'As many properties and units as you manage, all in a single account.',
  },
];

const STEPS = [
  { title: 'Add a property', desc: 'Name, address, and its units. Done in minutes.' },
  { title: 'Attach a tenant', desc: 'A tenant, a unit, a rent amount, a start date.' },
  { title: 'Track and collect', desc: 'Rent charges appear on schedule. Payments update balances instantly.' },
];

export default function HomePage() {
  return (
    <main className="flex flex-col bg-white text-gray-900 font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge
              variant="outline"
              className="mb-8 inline-flex rounded-full border-primary/20 bg-primary/5 px-4 py-1.5 font-semibold tracking-wide text-primary"
            >
              Built for Kenyan landlords and agents
            </Badge>

            <h1 className="mb-8 text-5xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Rental management,
              <span className="mt-2 block text-primary">
                <WordSwitcher
                  words={['without the spreadsheet', 'without the chaos', 'without the guesswork']}
                  className="min-w-[1em]"
                />
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-500 lg:text-xl">
              Properties, units, tenants, rent, and payments, all in one simple place.
              Know who owes you, get paid, and move on with your day.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={`${AUTH_ROUTES.REGISTER}?role=landlord`} prefetch>
                <Button
                  size="lg"
                  className="h-14 rounded-full bg-gray-900 px-8 text-lg font-medium text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-gray-800 active:scale-95"
                >
                  Start managing your properties
                </Button>
              </Link>
              <Link href="/how-it-works" prefetch>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-full border-gray-200 bg-gray-50/50 px-8 text-lg font-medium text-gray-600 transition-transform hover:scale-[1.02] hover:bg-gray-100 active:scale-95"
                >
                  See how it works
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[140px]" />
        </div>
      </section>

      {/* Dashboard preview, shown right away */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8" aria-label="What your dashboard looks like">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl shadow-gray-200/60">
          <div className="flex items-center gap-2 bg-gray-900 px-8 py-4">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
            <span className="ml-4 text-sm font-medium text-gray-400">Dashboard</span>
          </div>
          <div className="grid grid-cols-2 gap-4 p-8 sm:grid-cols-4">
            {DASHBOARD_STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl bg-gray-50 p-5 text-left">
                <Icon className="mb-3 h-5 w-5 text-primary" aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 p-8 pt-6">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Needs attention</p>
            <div className="flex items-center justify-between rounded-2xl bg-red-50 px-5 py-4">
              <span className="text-sm font-medium text-gray-900">Unit B204: rent overdue since Aug 5</span>
              <Badge variant="destructive" className="rounded-full">KES 22,000</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Outcome pillars */}
      <section className="bg-gray-50/60 py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-3xl bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Landlords + Tenants, side by side */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
              <Badge variant="outline" className="mb-5 rounded-full border-primary/20 bg-primary/5 font-semibold tracking-wide text-primary">
                LANDLORDS & AGENTS
              </Badge>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Everything, at a glance</h2>
              <ul className="mb-8 space-y-4">
                {[
                  'See which units are occupied and which are vacant',
                  'Know exactly who owes rent and how much',
                  'Accept Paystack payments or record cash yourself',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href={`${AUTH_ROUTES.REGISTER}?role=landlord`} prefetch>
                <Button className="rounded-full px-6 font-semibold">
                  Start managing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-gray-50/60 p-10 shadow-sm">
              <Badge variant="outline" className="mb-5 rounded-full border-primary/20 bg-primary/10 font-semibold tracking-wide text-primary">
                TENANTS
              </Badge>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Your rent, in one place</h2>
              <ul className="mb-8 space-y-4">
                {[
                  'See your unit, your rent, and your balance',
                  'Pay securely via Paystack in seconds',
                  'Every payment recorded and ready as a receipt',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/how-it-works" prefetch>
                <Button variant="outline" className="rounded-full px-6 font-semibold">
                  See how it works
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Three steps */}
      <section className="bg-gray-50/60 py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">Live in minutes</h2>
            <p className="mb-14 text-lg text-gray-600">No onboarding call. No setup wizard.</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-8 rounded-3xl bg-gray-50/60 p-10 text-center shadow-sm sm:flex-row sm:text-left">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
              <h3 className="text-2xl font-bold text-gray-900">From KES 50 per unit, per month</h3>
              <p className="mt-1 text-gray-600">30-day free trial. No credit card required.</p>
            </div>
            <Link href="/pricing" prefetch>
              <Button size="lg" variant="outline" className="rounded-full px-8 font-semibold">
                See full pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-900 py-20 text-white lg:py-28">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold lg:text-4xl">Ready to stop guessing who paid?</h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-gray-300">
            Set up your first property today and see the difference by the end of the month.
          </p>
          <Link href={`${AUTH_ROUTES.REGISTER}?role=landlord`} prefetch>
            <Button size="lg" className="h-14 rounded-full bg-white px-8 text-lg font-medium text-gray-900 hover:bg-gray-100">
              Get started for free
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
