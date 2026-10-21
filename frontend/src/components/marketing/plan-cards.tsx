import Link from 'next/link';
import { Check } from 'lucide-react';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';
import type { PublicPlan } from '@/lib/seo';

const RECOMMENDED = 'pro';

function limit(count: number | undefined, one: string, many: string): string {
  if (count === undefined) return '';
  if (count === 0) return `Unlimited ${many}`;
  return `Up to ${count} ${count === 1 ? one : many}`;
}

export function formatKes(price: string): string {
  return `KES ${Math.round(Number(price)).toLocaleString('en-KE')}`;
}

/**
 * Plan cards rendered on the server from the live plan list, so the prices
 * are in the HTML that search engines and AI assistants read.
 */
export function PlanCards({ plans }: { plans: PublicPlan[] }) {
  if (plans.length === 0) {
    return (
      <p className="text-center text-sm text-gray-600">
        Prices are loading slowly right now. <Link href="/contact" className="font-medium text-primary underline underline-offset-4">Ask us</Link> and we will reply the same day.
      </p>
    );
  }
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => {
        const recommended = plan.slug === RECOMMENDED;
        const points = [
          limit(plan.max_properties, 'property', 'properties'),
          limit(plan.max_units, 'unit', 'units'),
          limit(plan.max_caretaker_seats, 'caretaker', 'caretakers'),
          'M-Pesa matching, receipts and reminders',
          'Statements and rental income tax figures',
        ].filter(Boolean);
        return (
          <li
            key={plan.slug}
            className={cn(
              'flex flex-col rounded-2xl border bg-white p-6',
              recommended ? 'border-primary ring-1 ring-primary' : 'border-gray-200',
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              {recommended && <span className="text-xs font-semibold text-primary">Most landlords pick this</span>}
            </div>
            <p className="mt-4">
              <span className="text-3xl font-semibold tracking-tight text-gray-900">{formatKes(plan.price)}</span>
              <span className="text-sm text-gray-500"> / month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-gray-700">
              {points.map((point) => (
                <li key={point} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href={AUTH_ROUTES.REGISTER}
              className={cn(
                'mt-6 inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                recommended
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-gray-300 text-gray-900 hover:bg-gray-50',
              )}
            >
              Start 30-day free trial
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
