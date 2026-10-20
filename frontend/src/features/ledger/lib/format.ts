/** Display helpers shared by ledger screens. */

export function formatKes(amount: string | number | null | undefined, opts?: { cents?: boolean }) {
  const n = Number(amount ?? 0);
  return `KES ${n.toLocaleString('en-KE', {
    minimumFractionDigits: opts?.cents ? 2 : 0,
    maximumFractionDigits: opts?.cents ? 2 : 0,
  })}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const INVOICE_TYPE_LABEL: Record<string, string> = {
  rent: 'Rent',
  deposit: 'Deposit',
  penalty: 'Late penalty',
  adhoc: 'Charge',
};

export const LINE_TYPE_LABEL: Record<string, string> = {
  rent: 'Rent',
  service_charge: 'Service charge',
  water: 'Water',
  electricity: 'Electricity',
  garbage: 'Garbage',
  parking: 'Parking',
  penalty: 'Late penalty',
  deposit: 'Deposit',
  repair: 'Repair',
  other: 'Other',
};

export const EXTRA_LINE_TYPES = ['service_charge', 'water', 'electricity', 'garbage', 'parking', 'repair', 'other'] as const;

export const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Upcoming',
  due: 'Due',
  partially_paid: 'Part paid',
  paid: 'Paid',
  overdue: 'Overdue',
  waived: 'Waived',
  disputed: 'Disputed',
};

/**
 * Best human message from the normalized ApiError ({ message, statusCode, details })
 * produced by lib/api/client — including DRF field errors wrapped as
 * { errors: { field: [msg] } }.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { message?: string; details?: Record<string, unknown> } | undefined;
  if (e?.message && e.message !== 'An error occurred') return e.message;
  const details = (e?.details ?? {}) as Record<string, unknown>;
  const fields = (details.errors ?? details) as Record<string, unknown>;
  for (const value of Object.values(fields ?? {})) {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    if (typeof value === 'string' && value) return value;
  }
  return fallback;
}

/** Trigger a browser download for a Blob. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
