import type { Metadata } from 'next';
import { FadeIn } from '@/components/animations/fade-in';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about RumiaRent.',
};

const FAQ_CATEGORIES = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'How do I create an account?',
        answer:
          'Click "Sign up," choose your role (Landlord or Tenant), and fill in your details. You\'ll receive a verification email to complete registration. Caretaker accounts are created by their landlord.',
      },
      {
        question: 'Is RumiaRent free to try?',
        answer:
          'Yes. Every plan starts with a 30-day free trial, no credit card required. See Pricing for what\'s included.',
      },
      {
        question: 'What do I need to set up my first property?',
        answer:
          'Just a property name and address. Add units, then attach tenants as you go. There\'s no bulk import required to get started.',
      },
    ],
  },
  {
    title: 'Properties & Tenancies',
    items: [
      {
        question: 'What counts as a "unit"?',
        answer:
          'Any rentable space: an apartment, a house, or a room in an estate. Each unit belongs to one property and can have one active tenancy at a time.',
      },
      {
        question: 'Can a unit have two tenants at once?',
        answer:
          'No. RumiaRent enforces one active tenancy per unit. To move a new tenant in, terminate the current tenancy first.',
      },
      {
        question: 'How do I end a tenancy?',
        answer:
          'Open the tenancy and choose "Terminate." The unit is automatically marked vacant and ready for the next tenant.',
      },
    ],
  },
  {
    title: 'Rent & Payments',
    items: [
      {
        question: 'How does rent get charged?',
        answer:
          'RumiaRent generates the next rent charge automatically for every active tenancy, based on the rent amount and due day you set.',
      },
      {
        question: 'What payment methods do you support?',
        answer:
          'Paystack for card and bank payments, plus manual recording for cash or bank transfers you receive directly.',
      },
      {
        question: 'How is a payment confirmed?',
        answer:
          'Paystack payments are verified directly with Paystack before your records update. It is never based on what the tenant\'s browser reports. You get a confirmation the moment it clears.',
      },
      {
        question: 'What if a payment is reversed or fails?',
        answer:
          'The rent charge automatically returns to outstanding, and it stays visible until it\'s resolved.',
      },
    ],
  },
  {
    title: 'For Landlords & Agents',
    items: [
      {
        question: 'Can I manage multiple properties?',
        answer:
          'Yes. Add as many properties and units as you manage, all under one account.',
      },
      {
        question: 'Can I give caretakers access?',
        answer:
          'Yes. Caretaker accounts can be scoped to only the specific properties they manage, nothing else.',
      },
      {
        question: 'How do I see who owes me rent?',
        answer:
          'Your Rent page shows every outstanding and overdue charge, updated in real time, with a one-click way to record a payment.',
      },
    ],
  },
  {
    title: 'Security & Privacy',
    items: [
      {
        question: 'Can other landlords see my data?',
        answer:
          'No. Every property, tenant, and payment record is isolated to your organization, enforced on the server rather than just hidden in the interface.',
      },
      {
        question: 'Is my tenant\'s personal information protected?',
        answer:
          'Yes. Tenant contact details and financial records are only visible to you, your permitted caretakers, and the tenant themselves.',
      },
      {
        question: 'Do you store card details?',
        answer:
          'No. Card payments are processed entirely by Paystack, and RumiaRent never stores card numbers.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-white py-24 md:py-32">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Find answers to common questions about RumiaRent. Can&apos;t find what you&apos;re
              looking for?{' '}
              <Link
                href="/contact"
                className="text-green-600 hover:text-green-700 font-semibold underline-offset-4 hover:underline"
              >
                Contact us
              </Link>
              .
            </p>
          </div>
        </FadeIn>
      </section>

      {/* FAQ Sections */}
      <section className="py-24 md:py-32 bg-white">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-12">
              {FAQ_CATEGORIES.map((category, categoryIndex) => (
                <div key={category.title}>
                  <h2 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
                    {category.title}
                  </h2>
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {category.items.map((item, itemIndex) => (
                      <AccordionItem
                        key={item.question}
                        value={`${categoryIndex}-${itemIndex}`}
                        className="rounded-2xl border border-gray-100 px-6 shadow-sm"
                      >
                        <AccordionTrigger className="text-left font-semibold hover:no-underline">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600 leading-relaxed">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-24 md:py-32">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Still have questions?
            </h2>
            <p className="mb-8 text-lg text-gray-600">
              Our support team is here to help. Get in touch and we&apos;ll respond as
              soon as possible.
            </p>
            <Link href="/contact" prefetch>
              <Button size="lg" className="h-12 px-8">
                Contact Support
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
