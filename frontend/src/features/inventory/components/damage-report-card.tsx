import type { DamageReport } from '@/features/inventory';

export interface DamageReportCardProps {
  report: DamageReport;
}

export const DamageReportCard = ({ report }: DamageReportCardProps) => {
  return (
    <div>
      <div>Damage report placeholder card</div>
      <pre>{JSON.stringify(report, null, 2)}</pre>
    </div>
  );
};
