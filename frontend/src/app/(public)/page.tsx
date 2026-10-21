import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight, BellRing, Building2, FileText, Landmark, ReceiptText, Smartphone, Users,
} from 'lucide-react';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { SHARE_IMAGE, SITE_URL, fetchPublicPlans } from '@/lib/seo';
import { FAQS, FEATURES, ONE_LINER, STEPS } from '@/lib/marketing';
import { PlanCards, formatKes } from '@/components/marketing/plan-cards';
import { FaqList, faqSchema } from '@/components/marketing/faq-list';

export const revalidate = 3600;

const TITLE = 'RumiaRent: M-Pesa rent collection and rental management for Kenyan landlords';
const DESCRIPTION =
  'Every M-Pesa rent payment matched to the right tenant and receipted automatically, with reminders, arrears and statements. ' +
  'For landlords and agents in Kenya. 30-day free trial.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/', images: [SHARE_IMAGE] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const FEATURE_ICONS = {
  mpesa: Smartphone,
  invoices: ReceiptText,
  reminders: BellRing,
  books: FileText,
  team: Users,
  vacancies: Building2,
} as const;

function Section({ id, children, className = '' }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 py-16 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-gray-600">{intro}</p>}
    </div>
  );
}

export default async function HomePage() {
  const plans = await fetchPublicPlans();
  const cheapest = plans.length ? plans.reduce((a, b) => (Number(a.price) <= Number(b.price) ? a : b)) : null;

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'RumiaRent',
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Property management software',
    operatingSystem: 'Web browser (phone, tablet, computer)',
    areaServed: { '@type': 'Country', name: 'Kenya' },
    description: ONE_LINER,
    featureList: FEATURES.map((f) => f.title),
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: Number(plan.price).toFixed(2),
      priceCurrency: 'KES',
      url: `${SITE_URL}/pricing`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(FAQS)) }} />

      {/* Hero: what it does, for whom, one action, and the real product, on brand green. */}
      <section className="relative overflow-hidden bg-[#033d2a] px-4 pb-16 pt-14 text-white sm:pt-20 md:pb-40">
        {/* One soft light source; no patterns or blobs. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_85%_0%,rgba(52,211,153,0.22),transparent_70%)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
              Know who has paid rent, without checking M‑Pesa messages.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-emerald-50/80 sm:text-xl">
              Rent collection for Kenyan landlords. Payments matched, receipted and chased for you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={AUTH_ROUTES.REGISTER}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-base font-semibold text-[#033d2a] transition-colors hover:bg-emerald-50"
              >
                Start free for 30 days <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/25 px-5 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-5 text-sm text-emerald-50/70">No card needed. Rent goes straight to you, never through us.</p>
          </div>

          {/* The dashboard as it looks on a phone: fills the right side on desktop, sits under the text on phones. */}
          <div className="relative flex justify-center lg:col-span-5 lg:justify-end">
            <figure className="w-[250px] overflow-hidden rounded-[2rem] border-[7px] border-gray-950 bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:w-[270px]">
              <Image
                src="/images/product/dashboard-mobile-v2.webp"
                alt="RumiaRent on a phone: M-Pesa payments to assign, tenants in arrears and rent collected this month"
                width={585}
                height={1266}
                priority
                sizes="270px"
                className="h-auto w-full"
              />
            </figure>
            <div className="absolute -left-2 bottom-10 hidden w-56 rounded-xl bg-white p-3 text-gray-900 shadow-xl sm:block lg:-left-10">
              <p className="text-xs font-medium text-gray-500">M-Pesa · just now</p>
              <p className="mt-1 text-sm font-semibold">KES 18,000 from Lucy Atieno</p>
              <p className="mt-0.5 text-xs text-emerald-700">Matched to R3 · receipt sent</p>
            </div>
          </div>
        </div>
      </section>

      {/* The full desktop dashboard, rising out of the green hero. */}
      <section className="relative hidden px-4 md:block">
        <div className="relative mx-auto -mt-28 max-w-6xl">
          <figure className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]">
            <div className="flex h-8 items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-3" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            </div>
            <Image
              src="/images/product/dashboard-v2.webp"
              alt="RumiaRent landlord dashboard showing rent collected this month, tenants who owe, occupancy and M-Pesa payments to assign"
              width={1600}
              height={1012}
              sizes="(min-width: 1200px) 1152px, 100vw"
              className="h-auto w-full"
            />
          </figure>
          <figure className="absolute -bottom-10 right-4 w-[200px] overflow-hidden rounded-[1.75rem] border-[6px] border-gray-900 bg-white shadow-2xl lg:right-10 lg:w-[230px]">
            <Image
              src="/images/product/tenant-pay-v2.webp"
              alt="A tenant's phone showing the landlord's paybill number and their own account number"
              width={585}
              height={1266}
              sizes="230px"
              className="h-auto w-full"
            />
          </figure>
        </div>
      </section>

      <Section id="how-it-works" className="bg-white">
        <SectionHeading eyebrow="How it works" title="Set up in minutes" />
        <ol className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-gray-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="mpesa">
        <div className="grid items-center gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <SectionHeading
              eyebrow="M-Pesa"
              title="Payments that record themselves"
              intro="Each payment lands on the right tenant with a receipt. Anything unclear waits for you."
            />
          </div>
          <figure className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-3">
            <Image
              src="/images/product/mpesa-matches.webp"
              alt="List of M-Pesa payments, each matched to a tenant with a receipt number, and one waiting to be assigned"
              width={1200}
              height={504}
              sizes="(min-width: 1024px) 690px, 100vw"
              className="h-auto w-full"
            />
          </figure>
        </div>
      </Section>

      <Section id="features" className="border-t border-gray-100">
        <SectionHeading eyebrow="Features" title="Everything rent day needs" />
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = FEATURE_ICONS[feature.key];
            return (
              <li key={feature.key}>
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-3 text-base font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-1.5 leading-relaxed text-gray-600">{feature.body}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section className="bg-gray-900 text-white">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Landmark className="h-8 w-8 text-emerald-400" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Your rent never passes through us</h2>
          </div>
          <p className="text-lg leading-relaxed text-gray-300">
            Tenants pay your own paybill, as they do today. The money is yours the moment they pay. We only record it.
          </p>
        </div>
      </Section>

      <Section id="pricing">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Pricing"
            title="One flat monthly price"
            intro={`${cheapest ? `From ${formatKes(cheapest.price)} a month. ` : ''}30 days free.`}
          />
          <Link href="/pricing" className="text-sm font-semibold text-primary hover:underline">Compare plans</Link>
        </div>
        <div className="mt-10">
          <PlanCards plans={plans} />
        </div>
      </Section>

      <Section id="faq" className="border-t border-gray-100 bg-gray-50/60">
        <div className="grid gap-10 lg:grid-cols-3">
          <div>
            <SectionHeading eyebrow="Questions" title="Common questions" />
            <Link href="/faq" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">All questions</Link>
          </div>
          <div className="lg:col-span-2">
            <FaqList items={FAQS.slice(1, 5)} />
          </div>
        </div>
      </Section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Try it with your own tenants</h2>
          <p className="mt-4 text-lg text-gray-600">Free for 30 days.</p>
          <Link
            href={AUTH_ROUTES.REGISTER}
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Start free for 30 days <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
