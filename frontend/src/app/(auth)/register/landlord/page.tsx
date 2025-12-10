import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { LandlordRegisterForm } from '@/components/auth/landlord-register-form';

export const metadata: Metadata = {
  title: 'Landlord Registration | Rumi',
  description:
    'List your hostels, manage tenants, and track payouts with Rumi.',
};

export default function LandlordRegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-2xl">
        <AuthCard
          title="Landlord registration"
          description="Create an account to list hostels, manage bookings, and receive secure payouts."
        >
          <LandlordRegisterForm />
        </AuthCard>
      </section>
    </main>
  );
}
