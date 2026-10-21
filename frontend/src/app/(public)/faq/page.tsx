import Link from 'next/link';
import type { Metadata } from 'next';
import { FAQS } from '@/lib/marketing';
import { FaqList, faqSchema } from '@/components/marketing/faq-list';

export const metadata: Metadata = {
  title: 'Help and FAQ',
  description:
    'Answers about RumiaRent: how M-Pesa rent payments are matched, receipts and reminders, tenants, caretakers, pricing and your data.',
  alternates: { canonical: '/faq' },
};

const byQuestion = Object.fromEntries(FAQS.map((f) => [f.q, f]));
const pick = (...questions: string[]) => questions.map((q) => byQuestion[q]);

const GROUPS = [
  {
    id: 'start',
    title: 'Getting started',
    items: [
      ...pick('What is RumiaRent?', 'Does it work on a phone?'),
      {
        q: 'How do I set up my first property?',
        a: 'Sign up, enter your business name, then add a property with how many units it has and the rent. RumiaRent creates the units for you, numbered the way you choose, such as A1 to A12.',
      },
      {
        q: 'How do I add a tenant?',
        a: 'Choose "Add tenant", pick a vacant unit and enter their name, phone and rent. Invoices, their account number and reminders start automatically. Tenants with an email address also get a login.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Rent and M-Pesa',
    items: [
      ...pick('Does RumiaRent hold my rent money?', 'How do tenants pay rent?', 'What if a tenant types the wrong account number?', 'Do I need my own paybill?'),
      {
        q: 'How do I connect my paybill so payments match automatically?',
        a: 'Add your paybill number in RumiaRent, then get your paybill approved on Safaricom\'s Daraja portal ("Go Live"), paste the two keys Safaricom gives you, and press Register. The M-Pesa paybill page walks you through each step.',
      },
      {
        q: 'What happens if a payment is missed?',
        a: 'Once a month RumiaRent reminds you to upload your M-Pesa or bank statement. Any payment that did not reach RumiaRent shows up so you can add it in one tap.',
      },
      {
        q: 'Can I record cash and bank payments?',
        a: 'Yes. Record a cash, bank or M-Pesa payment against a tenant and their receipt is sent the same way. Caretakers can record payments too, if you allow it.',
      },
    ],
  },
  {
    id: 'tenants',
    title: 'Tenants, caretakers and agents',
    items: [
      ...pick('Can my caretaker use it?'),
      {
        q: 'What do tenants see?',
        a: 'Their balance, invoices, receipts and how to pay: your paybill number and their own account number. They can also give notice to vacate and message you.',
      },
      {
        q: 'I am an agent. Can I manage properties for several owners?',
        a: 'Yes. Add each property owner, set your management and letting fees, and send each owner a monthly statement. Payouts to owners are recorded, and you send the money from your own bank or M-Pesa.',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Pricing and billing',
    items: [
      ...pick('How much does RumiaRent cost?'),
      {
        q: 'Do you take a percentage of rent?',
        a: 'No. RumiaRent is a flat monthly subscription. Your rent goes straight to you.',
      },
    ],
  },
  {
    id: 'data',
    title: 'Your data',
    items: [
      {
        q: 'Who can see my tenants\' information?',
        a: 'Only you and the caretakers you assign to a property. Tenants see only their own account. Details are in our privacy policy.',
      },
      {
        q: 'Can I export my records?',
        a: 'Yes. Download monthly statements as PDF and transactions as CSV, including a QuickBooks-friendly format.',
      },
    ],
  },
];

export default function FaqPage() {
  const all = GROUPS.flatMap((g) => g.items);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(all)) }} />
      <section className="px-4 pb-20 pt-12 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">Help and FAQ</h1>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Short answers to what landlords, agents and tenants ask most. Can&apos;t find yours?{' '}
              <Link href="/contact" className="font-medium text-primary hover:underline">Ask us</Link>.
            </p>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-4">
            <nav aria-label="Topics" className="hidden lg:block">
              <ul className="sticky top-24 space-y-2 text-sm">
                {GROUPS.map((group) => (
                  <li key={group.id}>
                    <a href={`#${group.id}`} className="text-gray-600 hover:text-gray-900">{group.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="space-y-12 lg:col-span-3">
              {GROUPS.map((group) => (
                <section key={group.id} id={group.id} className="scroll-mt-24">
                  <h2 className="mb-2 text-xl font-semibold text-gray-900">{group.title}</h2>
                  <FaqList items={group.items} />
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
