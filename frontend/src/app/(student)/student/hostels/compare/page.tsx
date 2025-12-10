'use client';
import HostelComparisonTable from '@/components/hostels/hostel-comparison-table';
import { useStudentStore } from '@/stores/useStudentStore';

export default function Page() {
  const compareList = useStudentStore((state) => state.compareList);
  return (
    <div className="compare-page">
      <h1 className="page-title">Compare Hostels</h1>
      <HostelComparisonTable hostels={compareList} />
    </div>
  );
}
