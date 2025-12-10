export interface DamageInvoiceProps {
  reportId: string;
}

export const DamageInvoice = ({ reportId }: DamageInvoiceProps) => {
  return (
    <div>
      <div>Damage invoice placeholder</div>
      <div>Report ID: {reportId}</div>
    </div>
  );
};
