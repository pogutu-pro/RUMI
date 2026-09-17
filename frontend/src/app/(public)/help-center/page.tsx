import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageCircle, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Get help with RumiaRent: answers to common questions, or reach us directly.',
};

const HELP_LINKS = [
  {
    icon: HelpCircle,
    title: 'Frequently asked questions',
    desc: 'Answers to the questions landlords and tenants ask most, about billing, payments, and how the platform works.',
    href: '/faq',
    cta: 'Read the FAQ',
  },
  {
    icon: BookOpen,
    title: 'Guides',
    desc: 'Practical guides for getting set up and getting the most out of RumiaRent.',
    href: '/guides',
    cta: 'Browse guides',
  },
  {
    icon: MessageCircle,
    title: 'Talk to us',
    desc: "Can't find what you're looking for? Send us a message and a real person will get back to you.",
    href: '/contact',
    cta: 'Contact support',
  },
];

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <section className="bg-white py-24 px-4 relative overflow-hidden border-b border-gray-100">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold text-primary mb-6">Help Center</h1>
          <p className="text-xl text-gray-600">
            Answers to common questions, guides to get you started, and a way to reach us directly.
          </p>
        </div>
      </section>

      {/* Links */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-3">
            {HELP_LINKS.map(({ icon: Icon, title, desc, href, cta }) => (
              <div
                key={title}
                className="rounded-3xl border border-gray-100 bg-gray-50/50 p-8 shadow-sm flex flex-col"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
                <p className="mb-6 text-sm leading-relaxed text-gray-600 flex-1">{desc}</p>
                <Link href={href}>
                  <Button variant="outline" className="rounded-full w-full font-semibold">
                    {cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
