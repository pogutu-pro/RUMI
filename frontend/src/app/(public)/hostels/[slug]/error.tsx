'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('Hostel page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8 text-center">
      <ErrorState
        title="Hostel Not Found"
        message="We couldn't find the hostel you're looking for. It may have been removed or the link is incorrect."
      />
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <Button onClick={reset} size="lg">
          Try Again
        </Button>
        <Link href="/hostels">
          <Button variant="outline" size="lg">
            Back to Search
          </Button>
        </Link>
      </div>
    </div>
  );
}
