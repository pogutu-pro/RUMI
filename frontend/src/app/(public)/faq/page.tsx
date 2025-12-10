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
  description: 'Find answers to common questions about Rumi.',
};

const FAQ_CATEGORIES = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'How do I create an account?',
        answer:
          'Click the "Sign up" button in the top right corner, choose your role (Student or Landlord), and fill in your details. You\'ll receive a verification email to complete your registration. Note: Caretaker accounts are created by verified landlords.',
      },
      {
        question: 'Is Rumi free to use?',
        answer:
          'Yes! Creating an account and browsing hostels is completely free. We only charge a small service fee when you successfully book a hostel.',
      },
      {
        question: 'What information do I need to sign up?',
        answer:
          'You\'ll need your email address, phone number, and basic personal information. Students may need to provide university details, while landlords need property documentation.',
      },
    ],
  },
  {
    title: 'Booking & Payments',
    items: [
      {
        question: 'How do I book a hostel?',
        answer:
          'Simply browse our listings, select your preferred hostel, choose your room type, select your move-in date, and complete the booking with M-PESA. You\'ll receive instant confirmation.',
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We currently accept M-PESA payments for instant booking. All transactions are secure and you\'ll receive a payment confirmation immediately.',
      },
      {
        question: 'Can I cancel my booking?',
        answer:
          'Cancellation policies vary by hostel. Most offer free cancellation up to 7 days before move-in. Check the specific hostel cancellation policy on their listing page.',
      },
      {
        question: 'When will I be charged?',
        answer:
          'You\'ll be charged when you complete the booking. The payment is processed securely through M-PESA, and you\'ll receive a confirmation receipt.',
      },
    ],
  },
  {
    title: 'Hostel Verification',
    items: [
      {
        question: 'Are all hostels verified?',
        answer:
          'Yes! Every hostel on Rumi undergoes a verification process. We check licenses, visit the property, verify photos, and ensure safety standards are met before listing.',
      },
      {
        question: 'What does "Verified Hostel" mean?',
        answer:
          'A verified hostel has been inspected by our team, has valid licenses, meets safety standards, and has accurate photos and information. Look for the green verification badge.',
      },
      {
        question: 'How do I report a problem with a hostel?',
        answer:
          'You can report issues through the hostel listing page or contact our support team directly. We take all reports seriously and investigate promptly.',
      },
    ],
  },
  {
    title: 'For Landlords',
    items: [
      {
        question: 'How do I list my hostel?',
        answer:
          'Sign up as a landlord, complete your profile, and click "List Your Property". You\'ll need to provide property details, photos, pricing, and availability.',
      },
      {
        question: 'What fees do landlords pay?',
        answer:
          'We charge a small commission on successful bookings. There are no upfront fees to list your property. Contact us for detailed pricing information.',
      },
      {
        question: 'How do I manage bookings?',
        answer:
          'Use your landlord dashboard to view all bookings, manage availability, communicate with students, and track payments. Everything is in one place.',
      },
      {
        question: 'How quickly will I receive payments?',
        answer:
          'Payments are processed through M-PESA and typically appear in your account within 24-48 hours after a booking is confirmed.',
      },
    ],
  },
  {
    title: 'Safety & Security',
    items: [
      {
        question: 'How do you ensure student safety?',
        answer:
          'We verify all hostels, check safety standards, require valid licenses, and allow reviews from previous tenants. We also have a 24/7 support team available.',
      },
      {
        question: 'What if I have an emergency?',
        answer:
          'Contact our 24/7 support team immediately. We also provide emergency contact information for each hostel on their listing page.',
      },
      {
        question: 'Is my personal information safe?',
        answer:
          'Absolutely. We use industry-standard encryption and security measures to protect your data. We never share your information with third parties without your consent.',
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
              Find answers to common questions about Rumi. Can't find what you're
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
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full space-y-4"
                  >
                    {category.items.map((item, itemIndex) => (
                      <AccordionItem
                        key={item.question}
                        value={`${categoryIndex}-${itemIndex}`}
                        className="rounded-lg border border-gray-200 px-6"
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
              Our support team is here to help. Get in touch and we'll respond as
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
