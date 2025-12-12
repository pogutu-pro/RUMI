'use client';
import { HostelList } from '@/features/hostels';
import { useReviewStore } from '@/features/reviews';

export default function Page() {
  // TODO: Fetch real hostels and filter by those the user can review
  const hostels = [];
  return (
    <div className="favorites-page">
      <h1 className="page-title">My Hostel Reviews</h1>
      <HostelList hostels={hostels} basePath="/student/hostels" />
    </div>
  );
}
