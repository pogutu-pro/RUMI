import type { Metadata } from 'next';
import { AudiencePage, type AudienceContent } from '@/components/marketing/audience-page';

const content: AudienceContent = {
  path: '/for/landlords',
  name: 'For landlords',
  title: 'Rental management software for landlords in Kenya',
  intro:
    'For landlords with one building or several. Tenants keep paying your M-Pesa paybill; RumiaRent records each payment against the right tenant, sends the receipt and reminds whoever is late.',
  points: [
    { title: 'Know who has paid', body: 'Every M-Pesa payment lands on the right tenant automatically, with a receipt sent.' },
    { title: 'Stop chasing rent', body: 'Reminders go out before and after the due date. Arrears are in one list.' },
    { title: 'Water and other bills', body: 'Add service charge, water or garbage to monthly invoices, metered or fixed.' },
    { title: 'Your caretaker, your rules', body: 'Caretakers see only their buildings and can record cash if you allow it.' },
    { title: 'Monthly statements and tax', body: 'Income, expenses and your monthly rental income tax figure, ready each month.' },
    { title: 'Your money stays yours', body: 'Rent goes straight to your paybill or bank. RumiaRent never holds it.' },
  ],
  faqs: [
    {
      q: 'Is RumiaRent good for a landlord with only a few units?',
      a: 'Yes. The Starter plan covers one property with up to 10 units, and setup takes a few minutes: add the property, then your tenants.',
    },
    {
      q: 'Do my tenants need to download an app?',
      a: 'No. They keep paying your paybill as usual and get receipts by SMS. If they have an email address they also get a login to see their balance in the browser.',
    },
    {
      q: 'Can I use RumiaRent without a paybill?',
      a: 'Yes. You can record cash, bank and M-Pesa payments yourself or upload your statement. A paybill is what lets payments be matched automatically.',
    },
  ],
  guides: ['collect-rent-with-mpesa', 'rental-income-tax-kenya', 'late-rent-kenya'],
};

export const metadata: Metadata = {
  title: 'For landlords: rental management software in Kenya',
  description: content.intro,
  alternates: { canonical: content.path },
};

export default function LandlordsPage() {
  return <AudiencePage content={content} />;
}
