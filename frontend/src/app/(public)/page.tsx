import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle2,
  Receipt,
  ShieldCheck,
  Zap,
  LayoutGrid,
  Landmark,
  Headset,
  MessageCircle,
  Lock,
  FileCheck2,
  KeyRound,
} from 'lucide-react';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animations/fade-in';
import { PricingTeaser } from './_components/pricing-teaser';
import { HeroSection } from './_components/hero-section';

export const metadata: Metadata = {
  title: 'RumiaRent - Rental Management for Kenyan Landlords',
  description:
    'RumiaRent helps Kenyan landlords and agents manage properties, track tenants, and collect rent. Simple enough to start using today.',
  openGraph: {
    title: 'RumiaRent - Rental Management for Kenyan Landlords',
    description:
      'Properties, units, tenants, rent, and payments in one simple place. Know who owes you, get paid via Paystack or cash, and see what needs attention.',
    url: 'https://rumiarent.com',
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

const PLATFORM_FEATURES = [
  {
    icon: Landmark,
    title: 'Bank, M-Pesa, and card payments',
    desc: 'Tenants pay however suits them, via Paystack: cards, bank transfers, and M-Pesa. It settles straight into your account, automatically matched to the right unit.',
  },
  {
    icon: Receipt,
    title: 'Automated invoicing and billing',
    desc: 'Rent charges are generated on schedule, every month, for every unit. No manual invoices, no spreadsheet, no forgetting a tenant.',
  },
  {
    icon: MessageCircle,
    title: 'Built-in communication module',
    desc: 'Automated SMS rent reminders and payment confirmations go out the moment they matter, so you are not the one sending them.',
  },
  {
    icon: Headset,
    title: 'Dedicated customer support',
    desc: 'Real people who understand rental management in Kenya, ready when a tenant or a payment needs a human.',
  },
];

const TRUST_POINTS = [
  {
    icon: KeyRound,
    title: 'Role-based access',
    desc: 'Landlords, caretakers, and tenants each see only what their role allows. No one gets more access than their job needs.',
  },
  {
    icon: Lock,
    title: 'Your data, kept separate',
    desc: 'Every account is isolated. Your properties, tenants, and payments are never visible to another landlord on the platform.',
  },
  {
    icon: FileCheck2,
    title: 'A full audit trail',
    desc: 'Every payment, every change, every action is logged, so you always know what happened and when.',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col bg-white text-gray-900 font-sans">
      <HeroSection />

      {/* Outcome pillars */}
      <section className="bg-gray-50/60 py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInStagger className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, desc }) => (
              <FadeInItem
                key={title}
                className="rounded-3xl bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Everything connected */}
      <section className="bg-white py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto mb-14 block max-w-2xl text-center" fullWidth>
            <Badge
              variant="outline"
              className="mb-6 inline-flex rounded-full border-primary/20 bg-primary/5 px-4 py-1.5 font-semibold tracking-wide text-primary"
            >
              ONE PLATFORM
            </Badge>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
              Everything connected, out of the box
            </h2>
            <p className="text-lg text-gray-600">
              Payments, invoicing, communication, and support, all built in, not bolted on.
            </p>
          </FadeIn>
          <FadeInStagger className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
            {PLATFORM_FEATURES.map(({ icon: Icon, title, desc }) => (
              <FadeInItem
                key={title}
                className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Landlords + Tenants, side by side */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            <FadeIn direction="left" className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm" fullWidth>
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
            </FadeIn>

            <FadeIn direction="right" className="rounded-3xl border border-gray-100 bg-gray-50/60 p-10 shadow-sm" fullWidth>
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
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Trust & security */}
      <section className="bg-gray-50/60 py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto mb-14 block max-w-2xl text-center" fullWidth>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
              Built to be trusted with your rent money
            </h2>
            <p className="text-lg text-gray-600">
              Role-based access, data isolation, and a full audit trail, on every account.
            </p>
          </FadeIn>
          <FadeInStagger className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
            {TRUST_POINTS.map(({ icon: Icon, title, desc }) => (
              <FadeInItem
                key={title}
                className="rounded-3xl bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Three steps */}
      <section className="bg-gray-50/60 py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto mb-14 block max-w-3xl text-center" fullWidth>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">Live in minutes</h2>
            <p className="text-lg text-gray-600">No onboarding call. No setup wizard.</p>
          </FadeIn>
          <FadeInStagger className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3" faster>
            {STEPS.map((step, i) => (
              <FadeInItem key={step.title} className="text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{step.desc}</p>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Talk to us */}
      <section className="bg-white py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto block max-w-3xl" fullWidth>
            <div className="rounded-[2rem] border border-gray-100 bg-white p-10 text-center shadow-sm sm:p-14">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">Want to see it live first?</h2>
              <p className="mb-8 text-lg text-gray-600">
                Book a short walkthrough, or message us on WhatsApp, whichever is faster for you.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/contact" prefetch>
                  <Button
                    size="lg"
                    className="h-14 rounded-full bg-gray-900 px-8 text-lg font-medium text-white transition-transform hover:scale-[1.02] hover:bg-gray-800 active:scale-95"
                  >
                    Book a Demo
                  </Button>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn fullWidth>
            <PricingTeaser />
          </FadeIn>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-900 py-20 text-white lg:py-28">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <FadeIn className="mx-auto block max-w-xl" fullWidth>
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">Ready to stop guessing who paid?</h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-gray-300">
              Set up your first property today and see the difference by the end of the month.
            </p>
            <Link href={`${AUTH_ROUTES.REGISTER}?role=landlord`} prefetch>
              <Button size="lg" className="h-14 rounded-full bg-white px-8 text-lg font-medium text-gray-900 transition-transform hover:scale-[1.02] hover:bg-gray-100 active:scale-95">
                Get started for free
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
