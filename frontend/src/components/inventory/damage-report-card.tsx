import type { DamageReport } from '@/lib/api/damage-reports';

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
