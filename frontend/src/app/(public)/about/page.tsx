import type { Metadata } from 'next';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animations/fade-in';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Users, Shield, Zap, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about Rumi and our mission to simplify student accommodation.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-white py-24 md:py-32">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              About Rumi
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              We're on a mission to make student accommodation simple, safe, and
              accessible for everyone.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Mission Section */}
      <section className="py-24 md:py-32 bg-white">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 sm:text-4xl">
              Our Mission
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-6 leading-relaxed">
                Rumi was born from a simple observation: finding the right
                student accommodation shouldn't be complicated or stressful. We
                saw students struggling with fake listings, unclear booking
                processes, and safety concerns.
              </p>
              <p className="mb-6 leading-relaxed">
                Our platform brings together verified hostels, trusted landlords,
                and students in one seamless ecosystem. We verify every property,
                streamline the booking process, and ensure secure payments through
                M-PESA.
              </p>
              <p className="leading-relaxed">
                Today, Rumi is trusted by thousands of students across Kenya,
                helping them find safe, affordable accommodation near their
                campuses.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-24 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Our Values
              </h2>
            </FadeIn>
            <FadeInStagger className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: <Shield className="h-10 w-10 text-green-600" />,
                  title: 'Safety First',
                  description:
                    'Every hostel is verified for legitimacy and safety standards.',
                },
                {
                  icon: <Zap className="h-10 w-10 text-green-600" />,
                  title: 'Simplicity',
                  description:
                    'We make complex processes simple and user-friendly.',
                },
                {
                  icon: <Users className="h-10 w-10 text-green-600" />,
                  title: 'Community',
                  description:
                    'Building connections between students and landlords.',
                },
                {
                  icon: <Heart className="h-10 w-10 text-green-600" />,
                  title: 'Trust',
                  description:
                    'Transparency and honesty in everything we do.',
                },
              ].map((value, index) => (
                <FadeInItem
                  key={value.title}
                  className="rounded-xl border border-gray-200 bg-white p-6 text-center"
                >
                  <div className="mb-4 flex justify-center">{value.icon}</div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </FadeInItem>
              ))}
            </FadeInStagger>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-24 md:py-32">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold text-gray-900 sm:text-4xl">
              Join Us on This Journey
            </h2>
            <p className="mb-10 text-lg text-gray-600">
              Whether you're a student looking for accommodation or a landlord
              wanting to reach more students, we're here to help.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/hostels" prefetch>
                <Button size="lg" className="h-12 px-8">
                  Find Hostels
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact" prefetch>
                <Button size="lg" variant="charcoal" className="h-12 px-8">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
