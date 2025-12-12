"use client";

import { DamageReportList } from '@/features/inventory';
import { useDamageReports } from '@/hooks/use-damage-reports';

const DamageReportsContent = () => {
  const { data, isLoading, error } = useDamageReports();

  if (isLoading) {
    return <div>Loading damage reports...</div>;
  }

  if (error) {
    return <div>Failed to load damage reports.</div>;
  }

  return <DamageReportList reports={data ?? []} />;
};

export default function Page() {
  return <DamageReportsContent />;
}
