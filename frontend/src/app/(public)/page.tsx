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
import { SHARE_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'RumiaRent - Rental Management for Kenyan Landlords',
  description:
    'RumiaRent helps Kenyan landlords and agents manage properties, track tenants, and collect rent. Simple enough to start using today.',
  openGraph: {
    title: 'RumiaRent - Rental Management for Kenyan Landlords',
    description:
      'Properties, units, tenants, rent, and payments in one simple place. Know who owes you, get paid straight to your M-Pesa paybill, and see what needs attention.',
    url: '/',
    siteName: 'RumiaRent',
    locale: 'en_KE',
    type: 'website',
    images: [SHARE_IMAGE],
  },
  alternates: { canonical: '/' },
  keywords: [
    'rental management Kenya',
    'landlord software Kenya',
    'property management system Kenya',
    'rent collection app',
    'M-Pesa rent collection',
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
    desc: 'Tenants pay your M-Pesa paybill and get a receipt automatically. Cash and bank payments take a tap to record.',
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
    title: 'Your paybill, matched automatically',
    desc: 'Rent lands straight in your own M-Pesa paybill or bank account. Each tenant has their own account number, so every payment is matched to the right unit and receipted.',
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
      <section className="bg-gray-50/60 py-12 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInStagger className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-3 sm:gap-6">
            {PILLARS.map(({ icon: Icon, title, desc }) => (
              <FadeInItem
                key={title}
                className="flex items-start gap-4 rounded-3xl bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:block sm:p-8 sm:text-center"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 sm:mx-auto sm:mb-5 sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-bold text-gray-900 sm:mb-2 sm:text-lg">{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
                </div>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Everything connected */}
      <section className="bg-white py-12 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto mb-8 block lg:mb-14 max-w-2xl text-center" fullWidth>
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
          <FadeInStagger className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 sm:gap-6">
            {PLATFORM_FEATURES.map(({ icon: Icon, title, desc }) => (
              <FadeInItem
                key={title}
                className="flex items-start gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:block sm:p-8"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 sm:mb-5 sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-bold text-gray-900 sm:mb-2 sm:text-lg">{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
                </div>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Landlords + Tenants, side by side */}
      <section className="py-12 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            <FadeIn direction="left" className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10" fullWidth>
              <Badge variant="outline" className="mb-5 rounded-full border-primary/20 bg-primary/5 font-semibold tracking-wide text-primary">
                LANDLORDS & AGENTS
              </Badge>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Everything, at a glance</h2>
              <ul className="mb-8 space-y-4">
                {[
                  'See which units are occupied and which are vacant',
                  'Know exactly who owes rent and how much',
                  'Payments to your paybill matched to the right tenant',
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

            <FadeIn direction="right" className="rounded-3xl border border-gray-100 bg-gray-50/60 p-6 shadow-sm sm:p-10" fullWidth>
              <Badge variant="outline" className="mb-5 rounded-full border-primary/20 bg-primary/10 font-semibold tracking-wide text-primary">
                TENANTS
              </Badge>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Your rent, in one place</h2>
              <ul className="mb-8 space-y-4">
                {[
                  'See your unit, your rent, and your balance',
                  'Pay with M-Pesa, the way you already do',
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
      <section className="bg-gray-50/60 py-12 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto mb-8 block lg:mb-14 max-w-2xl text-center" fullWidth>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
              Built to be trusted with your rent money
            </h2>
            <p className="text-lg text-gray-600">
              Role-based access, data isolation, and a full audit trail, on every account.
            </p>
          </FadeIn>
          <FadeInStagger className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3 sm:gap-6">
            {TRUST_POINTS.map(({ icon: Icon, title, desc }) => (
              <FadeInItem
                key={title}
                className="flex items-start gap-4 rounded-3xl bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:block sm:p-8 sm:text-center"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 sm:mx-auto sm:mb-5 sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-bold text-gray-900 sm:mb-2 sm:text-lg">{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
                </div>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Three steps */}
      <section className="bg-gray-50/60 py-12 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto mb-8 block lg:mb-14 max-w-3xl text-center" fullWidth>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">Live in minutes</h2>
            <p className="text-lg text-gray-600">No onboarding call. No training needed.</p>
          </FadeIn>
          <FadeInStagger className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3 sm:gap-6" faster>
            {STEPS.map((step, i) => (
              <FadeInItem key={step.title} className="flex items-start gap-4 text-left sm:block sm:text-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white sm:mx-auto sm:mb-4">
                  {i + 1}
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-bold text-gray-900 sm:mb-2">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{step.desc}</p>
                </div>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Talk to us */}
      <section className="bg-white py-12 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto block max-w-3xl" fullWidth>
            <div className="rounded-[2rem] border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-14">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">Want to see it live first?</h2>
              <p className="mb-8 text-lg text-gray-600">
                Send us a message and we will walk you through it.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/contact" prefetch>
                  <Button
                    size="lg"
                    className="h-14 rounded-full bg-gray-900 px-8 text-lg font-medium text-white transition-transform hover:scale-[1.02] hover:bg-gray-800 active:scale-95"
                  >
                    Talk to us
                  </Button>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-12 lg:py-28">
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
                Start your free 30 days
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
