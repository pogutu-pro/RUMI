import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth';
import { CaretakerRegistrationForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Caretaker Registration | Rumi',
  description: 'Manage hostel operations on behalf of verified landlords.',
};

export default function CaretakerRegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-2xl">
        <AuthCard
          title="Caretaker registration"
          description="Connect your invitation code to manage daily hostel operations."
        >
          <CaretakerRegistrationForm />
        </AuthCard>
      </section>
    </main>
  );
}
