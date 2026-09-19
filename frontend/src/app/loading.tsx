'use client';

import { RumiaLoader } from '@/components/ui/rumia-loader';

/** Shown by Next.js while a route segment is loading. */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-background">
      <RumiaLoader size={112} text="Preparing your RumiaRent experience" label="Loading content" />
    </div>
  );
}
