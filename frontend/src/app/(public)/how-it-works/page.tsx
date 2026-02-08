import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'How Rumia rental management platform works for landlords and students.',
};

const LANDLORD_FEATURES = [
  {
    tier: 'Core',
    title: 'Basic Records',
    description: 'Digital student and bed records, occupancy status, landlord dashboard, public listing.',
    features: ['Student & bed records', 'Occupancy status', 'Landlord dashboard', 'Public listing visibility'],
  },
  {
    tier: 'Control',
    title: 'Advanced Operations',
    description: 'Rent verification, payment history tracking, room transfers, and export capabilities.',
    features: ['Rent verification history', 'Room transfers tracking', 'Document exports', 'Advanced analytics'],
  },
  {
    tier: 'Finance',
    title: 'Financial Reporting',
    description: 'Compliance reporting, priority support, and managed collections (by application).',
    features: ['Compliance-ready reports', 'Priority 24/7 support', 'Collections onboarding', 'Risk-managed payouts'],
  }
];

const STUDENT_STEPS = [
  {
    title: 'Search Hostels',
    description: 'Filter by location, price, and amenities.',
  },
  {
    title: 'Book Room',
    description: 'Pay via M-PESA. Instant confirmation.',
  },
  {
    title: 'Track Payments',
    description: 'View rent history and receipts in your dashboard.',
  }
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <section className="border-b border-gray-200 py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How Rumia Works
          </h1>
          <p className="text-lg text-gray-700">
            Digital operations for student hostels. Rent tracking, occupancy management, and tenant records.
          </p>
        </div>
      </section>

      {/* For Landlords */}
      <section className="py-16 px-4 bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              For Landlords
            </h2>
            <p className="text-lg text-gray-700">
              Three tiers based on operational complexity.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {LANDLORD_FEATURES.map((tier) => (
              <div
                key={tier.tier}
                className="border border-gray-200 bg-white p-8"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                  {tier.tier}
                </span>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.title}</h3>
                <p className="text-gray-700 mb-6">
                  {tier.description}
                </p>
                
                <ul className="space-y-3 pt-6 border-t border-gray-200">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-sm text-gray-700">• {feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Students */}
      <section className="py-16 px-4 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              For Students
            </h2>
            <p className="text-lg text-gray-700">
              Search, book, and manage your rental from one dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STUDENT_STEPS.map((step, i) => (
              <div
                key={i}
                className="border border-gray-200 bg-white p-8"
              >
                <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-bold mb-4">
                  Step {i + 1}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-700">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link href="/hostels">
              <Button size="lg">
                Browse Hostels
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Verification Process
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                All hostels undergo license verification and physical inspection before listing.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Real-time Data</h4>
                  <p className="text-sm text-gray-700">Instant updates on occupancy and rent collection status.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Unified Portal</h4>
                  <p className="text-sm text-gray-700">One login for students, payments, and transfers.</p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 bg-gray-50 p-8">
              <h3 className="font-bold text-gray-900 mb-4">Platform Benefits</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li>• M-PESA payment integration</li>
                <li>• Digital tenant records</li>
                <li>• Rent payment tracking</li>
                <li>• Occupancy management</li>
                <li>• Document exports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gray-900 text-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-6">
            Start Using Rumia
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Replace spreadsheets and WhatsApp with dedicated hostel management software.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={AUTH_ROUTES.REGISTER}>
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Create Account
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
