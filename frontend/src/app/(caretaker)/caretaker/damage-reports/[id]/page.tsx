"use client";

import { DamageReportCard } from '@/features/inventory';
import { DamageInvoice } from '@/features/inventory';
import { useDamageReport } from '@/features/inventory';

import { use } from 'react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
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
  const { id } = use(params);
  return <DamageReportDetailContent id={id} />;
}
