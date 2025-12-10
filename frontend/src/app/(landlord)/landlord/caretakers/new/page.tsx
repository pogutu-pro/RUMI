'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { LandlordCreateCaretakerForm } from '@/components/landlord/landlord-create-caretaker-form';
import { useLandlordHostels } from '@/hooks/use-hostel';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NewCaretakerPage() {
  const router = useRouter();
  const { data: hostels, isLoading, error } = useLandlordHostels();

  const handleSuccess = () => {
    router.push('/landlord/caretakers');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/landlord/caretakers"
          className="hover:text-foreground transition-colors"
        >
          Caretakers
        </Link>
        <span>/</span>
        <span className="text-foreground">New Caretaker</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/landlord/caretakers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Create Caretaker Account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a new caretaker to manage your hostel operations
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-border bg-card p-6">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load hostels. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && hostels && (
          <LandlordCreateCaretakerForm
            hostels={hostels.map((h: { id: string; name: string }) => ({ id: h.id, name: h.name }))}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
}
