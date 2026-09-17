import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Guides',
  description: 'Practical guides for landlords and tenants using RumiaRent.',
};

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <section className="bg-white py-24 px-4 relative overflow-hidden border-b border-gray-100">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold text-primary mb-6">Guides</h1>
          <p className="text-xl text-gray-600 mb-10">
            Practical guides for getting set up and getting the most out of RumiaRent, published on
            our blog alongside product updates and landlord tips.
          </p>
          <Link href="/blog">
            <Button className="rounded-full px-10 h-14 text-lg font-medium">Browse the blog</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
