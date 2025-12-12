import type { CreateDamageReportPayload } from '@/features/inventory';

export interface DamageReportFormProps {
  onSubmit: (values: CreateDamageReportPayload) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: Error | null;
}

export const DamageReportForm = ({
  onSubmit,
  isSubmitting,
  error,
}: DamageReportFormProps) => {
  const handleSubmit = async () => {
    await onSubmit({ bookingId: '', items: [] });
  };

  return (
    <div>
      <div>Damage report form placeholder</div>
      {error && <div>Failed to submit damage report</div>}
      <button onClick={handleSubmit} disabled={isSubmitting}>
        Submit
      </button>
    </div>
  );
};
