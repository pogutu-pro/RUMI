import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { StudentRegisterForm } from '@/components/auth/student-register-form';

export const metadata: Metadata = {
  title: 'Student Registration | Rumi',
  description: 'Create your student account to access verified hostels.',
};

export default function StudentRegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-2xl">
        <AuthCard
          title="Student registration"
          description="Join thousands of students booking verified hostels on Rumi"
        >
          <StudentRegisterForm />
        </AuthCard>
      </section>
    </main>
  );
}
