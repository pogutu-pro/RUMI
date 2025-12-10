"use client";

import { DamageReportCard } from '@/components/inventory/damage-report-card';
import { DamageInvoice } from '@/components/inventory/damage-invoice';
import { useDamageReport } from '@/hooks/use-damage-reports';

interface PageProps {
  params: {
    id: string;
  };
}

const DamageReportDetailContent = ({ id }: { id: string }) => {
  const { data, isLoading, error } = useDamageReport(id);

  if (isLoading) {
    return <div>Loading damage report...</div>;
  }

  if (error || !data) {
    return <div>Failed to load damage report.</div>;
  }

  return (
    <div className="space-y-4">
      <DamageReportCard report={data} />
      <DamageInvoice reportId={data.id} />
    </div>
  );
};

export default function Page({ params }: PageProps) {
  return <DamageReportDetailContent id={params.id} />;
}
