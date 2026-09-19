import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Building2,
  Calculator,
  CalendarClock,
  ChartLine,
  CreditCard,
  FileSpreadsheet,
  Gift,
  HandCoins,
  HardHat,
  LifeBuoy,
  MessageSquare,
  Moon,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Rent collection, reminders, tenant and caretaker chat, and simple accounting with rental income tax figures. What RumiaRent does for landlords, caretakers and tenants.',
};

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Group {
  heading: string;
  intro: string;
  items: Feature[];
}

const LANDLORD_GROUPS: Group[] = [
  {
    heading: 'Run your properties',
    intro: 'Everything about your buildings, units and people in one place.',
    items: [
      {
        icon: Building2,
        title: 'Properties and units',
        description:
          'Organize every property into units, whether that is apartments, houses or an estate. See what is occupied and what is vacant at a glance.',
      },
      {
        icon: Users,
        title: 'Tenants and tenancies',
        description:
          'Add a tenant, attach them to a unit with a start date, rent and deposit, and they get an email to set up their own account. One active tenancy per unit, always.',
      },
      {
        icon: HardHat,
        title: 'Caretakers, with limits you set',
        description:
          'Invite caretakers to only the properties they look after, and choose whether they can add tenants and record payments. Nothing more.',
      },
    ],
  },
  {
    heading: 'Collect rent, know who owes',
    intro: 'Less chasing, fewer arguments, a record of every shilling.',
    items: [
      {
        icon: CalendarClock,
        title: 'Rent charges made for you',
        description:
          'RumiaRent creates the next rent charge for every active tenancy on schedule, so there is no manual invoicing.',
      },
      {
        icon: CreditCard,
        title: 'Online payments with Paystack',
        description:
          'Tenants pay from their own dashboard, in full or any amount they choose, and rent is paid out to the landlord’s account. Payment confirmations go to the tenant automatically.',
      },
      {
        icon: HandCoins,
        title: 'Cash, bank and M-Pesa payments too',
        description:
          'Landlords and permitted caretakers can record rent paid in cash, by bank transfer or straight to their M-Pesa. The tenant is told and their dashboard updates.',
      },
      {
        icon: Bell,
        title: 'Reminders by SMS and email',
        description:
          'Tenants are reminded before rent is due and when it is overdue. Overdue and outstanding balances are always visible to you.',
      },
    ],
  },
  {
    heading: 'Know your numbers, and your tax',
    intro: 'Free on every plan.',
    items: [
      {
        icon: Calculator,
        title: 'Monthly rental income tax figure',
        description:
          'RumiaRent works out the rent you actually received each month and the rental income tax (MRI) on it, with the deadline, a per-property breakdown and reminders before it is due. You file on iTax or eRITS yourself; we tell you what to enter.',
      },
      {
        icon: Wallet,
        title: 'Simple accounting',
        description:
          'Record expenses with receipts and see income, spending and profit for each month and each property.',
      },
      {
        icon: FileSpreadsheet,
        title: 'QuickBooks-ready exports',
        description:
          'Download your transactions as a CSV that QuickBooks Online can import, or as journal entries and a full ledger for your accountant.',
      },
      {
        icon: ChartLine,
        title: 'Income analytics',
        description:
          'Expected, collected, outstanding and overdue rent with your collection rate, by property. Included on the Pro and Enterprise plans.',
      },
    ],
  },
];

const CARETAKER_FEATURES: Feature[] = [
  {
    icon: Building2,
    title: 'Only your properties',
    description: 'See the properties, units and tenants you have been given, and nothing else.',
  },
  {
    icon: UserCheck,
    title: 'Add tenants',
    description: 'Register new tenants for the properties you manage, if your landlord allows it.',
  },
  {
    icon: HandCoins,
    title: 'Record rent received',
    description: 'If your landlord allows it, log cash, bank or M-Pesa rent as tenants hand it over, so the books are always current.',
  },
  {
    icon: MessageSquare,
    title: 'Talk to tenants and the landlord',
    description: 'Fix things faster by messaging the people involved, right inside RumiaRent.',
  },
];

const TENANT_FEATURES: Feature[] = [
  {
    icon: Building2,
    title: 'Your home at a glance',
    description: 'Your property, unit, monthly rent, deposit, due day and lease dates in one clear screen.',
  },
  {
    icon: Wallet,
    title: 'What you owe, right now',
    description: 'A live balance with no waiting on your landlord to tell you. When you are up to date, it says so.',
  },
  {
    icon: CreditCard,
    title: 'Pay your way',
    description: 'Pay the full amount, or choose how much to pay, including paying ahead of time.',
  },
  {
    icon: Bell,
    title: 'Confirmations you can keep',
    description: 'Every payment is recorded and confirmed, and your full history is always there.',
  },
  {
    icon: MessageSquare,
    title: 'Message your caretaker',
    description: 'A broken shower or a question about the house goes straight to the person who can help.',
  },
];

const EVERYONE_FEATURES: Feature[] = [
  {
    icon: MessageSquare,
    title: 'Built-in chat',
    description:
      'Tenants and caretakers, caretakers and landlords, and landlords and the RumiaRent team can message each other, with unread counts and notifications.',
  },
  {
    icon: LifeBuoy,
    title: 'Support when the system misbehaves',
    description: 'Something wrong with the app or your account? Open a ticket and our team follows it through.',
  },
  {
    icon: Smartphone,
    title: 'Works on any screen',
    description: 'Designed for phones, tablets and laptops, and it can be installed on your phone like an app.',
  },
  {
    icon: Moon,
    title: 'Light and dark mode',
    description: 'Switch from the profile menu, or let it follow your device.',
  },
  {
    icon: ShieldCheck,
    title: 'Your data stays yours',
    description:
      'Each landlord’s records are kept separate, access is limited by role, and important actions are logged.',
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900">{feature.title}</h3>
      <p className="text-base leading-relaxed text-gray-600">{feature.description}</p>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-white py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-4 text-4xl font-bold text-primary">Built for how rentals actually work</h1>
            <p className="text-xl leading-relaxed text-gray-600">
              Properties, tenants, rent, reminders, chat and simple accounting. Everything a landlord, caretaker
              or tenant needs, and nothing they do not.
            </p>
          </div>
        </div>
      </section>

      {/* Trial banner */}
      <section className="bg-white pt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-4xl items-center gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Gift className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <p className="text-base text-gray-700">
              <span className="font-semibold text-gray-900">Your first 30 days are free,</span> with every feature
              unlocked. Rental income tax figures and accounting are free on every plan, always.
            </p>
          </div>
        </div>
      </section>

      {/* Landlord features */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl space-y-16">
            <h2 className="text-3xl font-bold text-gray-900">For landlords and agents</h2>
            {LANDLORD_GROUPS.map((group) => (
              <div key={group.heading}>
                <h3 className="text-2xl font-bold text-gray-900">{group.heading}</h3>
                <p className="mb-6 mt-1 text-gray-600">{group.intro}</p>
                <div className="grid gap-6 md:grid-cols-2">
                  {group.items.map((feature) => (
                    <FeatureCard key={feature.title} feature={feature} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Caretaker features */}
      <section className="bg-gray-50/50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-2 text-3xl font-bold text-gray-900">For caretakers</h2>
            <p className="mb-8 text-gray-600">Invited by the landlord, with access to exactly what the job needs.</p>
            <div className="grid gap-6 md:grid-cols-2">
              {CARETAKER_FEATURES.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tenant features */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-2 text-3xl font-bold text-gray-900">For tenants</h2>
            <p className="mb-8 text-gray-600">Added by your landlord or caretaker. No sign-up forms to fill in.</p>
            <div className="grid gap-6 md:grid-cols-2">
              {TENANT_FEATURES.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Everyone */}
      <section className="bg-gray-50/50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-3xl font-bold text-gray-900">For everyone</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {EVERYONE_FEATURES.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href={`${AUTH_ROUTES.REGISTER}?role=landlord`} prefetch>
                <Button size="lg" className="h-14 rounded-full px-8 text-lg font-medium">
                  Start your free 30 days
                </Button>
              </Link>
              <Link href="/pricing" prefetch>
                <Button size="lg" variant="outline" className="h-14 rounded-full px-8 text-lg font-medium">
                  See pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
