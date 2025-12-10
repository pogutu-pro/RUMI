"use client";

import { useRouter } from 'next/navigation';

import { CARETAKER_ROUTES } from '@/lib/constants/routes';
import { DamageReportForm } from '@/components/inventory/damage-report-form';
import { useCreateDamageReport } from '@/hooks/use-damage-reports';
import type { CreateDamageReportPayload } from '@/lib/api/damage-reports';

export default function Page() {
  const router = useRouter();
  const createDamageReport = useCreateDamageReport();

  return (
    <DamageReportForm
      onSubmit={async (values: CreateDamageReportPayload) => {
        const report = await createDamageReport.mutateAsync(values);
        router.push(CARETAKER_ROUTES.DAMAGE_REPORTS.DETAIL(report.id));
      }}
      isSubmitting={createDamageReport.isPending}
      error={createDamageReport.error}
    />
  );
}
