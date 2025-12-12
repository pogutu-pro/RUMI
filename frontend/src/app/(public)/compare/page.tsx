'use client';

import { CompareView } from '@/features/hostels';

export default function PublicComparePage() {
  return (
    <div className="pt-24 min-h-screen bg-background"> {/* pt-24 to account for fixed header */}
      <CompareView 
        baseHostelPath="/hostels"
        backPath="/hostels"
      />
    </div>
  );
}
