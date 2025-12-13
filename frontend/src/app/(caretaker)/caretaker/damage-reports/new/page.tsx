"use client";

import { useRouter } from 'next/navigation';

import { CARETAKER_ROUTES } from '@/lib/constants/routes';
import { DamageReportForm } from '@/features/inventory';
import { useCreateDamageReport } from '@/features/inventory';
import type { CreateDamageReportPayload } from '@/features/inventory';

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
