import type { DamageReport } from '@/lib/api/damage-reports';
import { DamageReportCard } from './damage-report-card';

export interface DamageReportListProps {
  reports: DamageReport[];
}

export const DamageReportList = ({ reports }: DamageReportListProps) => {
  if (!reports.length) {
    return (
      <div className="py-8 text-sm text-slate-500 text-center">
        No damage reports found.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {reports.map((report) => (
        <DamageReportCard key={report.id} report={report} />
      ))}
    </div>
  );
};
