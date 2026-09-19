import { addMonths, format, parseISO, startOfMonth, subMonths } from 'date-fns';

export function kes(value: string | number | undefined | null): string {
  const n = Number(value ?? 0);
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** 'YYYY-MM' for a date. */
export function monthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function currentMonthKey(): string {
  return monthKey(new Date());
}

/** The last complete month: what the next MRI return is for. */
export function lastMonthKey(): string {
  return monthKey(subMonths(startOfMonth(new Date()), 1));
}

export function shiftMonth(key: string, by: number): string {
  return monthKey(addMonths(parseISO(`${key}-01`), by));
}

export function monthLabel(key: string): string {
  return format(parseISO(`${key.slice(0, 7)}-01`), 'MMMM yyyy');
}

export function dateLabel(iso: string): string {
  return format(parseISO(iso), 'd MMM yyyy');
}
