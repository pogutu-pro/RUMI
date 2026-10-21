'use client';

import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth';
import {
  useProperties,
  useUnits,
  useRentBalance,
  useIncomeSummary,
} from '@/features/rental/hooks/use-rental';
import { AttentionPanel } from '@/features/attention/attention-panel';
import { GetStarted } from '@/features/attention/get-started';
import { formatKes } from '@/features/ledger/lib/format';
import { isGateRejection, capitalizeTier } from '@/lib/api/gate';

function StatCard({ label, value, hint, href, action }: {
  label: string; value: React.ReactNode; hint?: string; href?: string; action?: string;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="p-4 pb-1 sm:p-6 sm:pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-4 pt-0 sm:p-6 sm:pt-0">
        <p className="text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {href && action && (
          <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            {action} <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

export default function LandlordRentalDashboard() {
  const { user } = useAuth();
  const { data: properties = [] } = useProperties();
  const { data: units = [] } = useUnits();
  const { data: balance } = useRentBalance();
  const { data: income, error: incomeError } = useIncomeSummary();

  const occupied = units.filter((u) => u.status === 'occupied').length;
  const vacant = units.filter((u) => u.status === 'vacant').length;
  const occupancy = units.length ? Math.round((occupied / units.length) * 100) : null;
  const collectionRate = income ? Math.round(Number(income.summary.collection_rate)) : null;
  const gateError = isGateRejection(incomeError);
  const owed = Number(balance?.outstanding_total ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{greeting()}{user?.first_name ? `, ${user.first_name}` : ''}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })} · {properties.length}{' '}
          {properties.length === 1 ? 'property' : 'properties'}, {units.length} {units.length === 1 ? 'unit' : 'units'}
        </p>
      </div>

      <GetStarted />
      <AttentionPanel />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Collected this month"
          value={income && !gateError ? formatKes(income.summary.collected_rent) : '—'}
          hint={income && !gateError ? `of ${formatKes(income.summary.expected_rent)} expected` : undefined}
          href="/landlord/rental/statements"
          action="Monthly statement"
        />
        <StatCard
          label="Tenants owe"
          value={formatKes(owed)}
          hint={Number(balance?.overdue_total ?? 0) > 0 ? `${formatKes(balance?.overdue_total)} overdue` : 'Nothing overdue'}
          href={owed > 0 ? '/landlord/rental/debt' : undefined}
          action="Follow up"
        />
        <StatCard
          label="Occupancy"
          value={occupancy === null ? '—' : `${occupancy}%`}
          hint={`${occupied} let · ${vacant} vacant`}
          href={vacant > 0 ? '/landlord/rental/properties' : undefined}
          action="Fill vacancies"
        />
        <StatCard
          label="Tenant credit held"
          value={formatKes(balance?.credit_total ?? 0)}
          hint="Applied automatically to the next invoices"
        />
      </div>

      {income && !gateError && income.by_property.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Collection by property this month</CardTitle>
            {collectionRate !== null && (
              <Badge
                variant="outline"
                className={
                  collectionRate >= 90
                    ? 'border-success/30 bg-success/10 text-success'
                    : collectionRate >= 60
                    ? 'border-warning/30 bg-warning/10 text-warning'
                    : 'border-destructive/30 bg-destructive/10 text-destructive'
                }
              >
                {collectionRate}% collected
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {income.by_property.map((p) => {
                const rate = Math.min(100, Math.round(Number(p.collection_rate)));
                return (
                  <li key={p.property_id} className="text-sm">
                    <div className="mb-1 flex justify-between">
                      <span className="font-medium">{p.property_name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatKes(p.collected_rent)} / {formatKes(p.expected_rent)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={rate}
                      aria-valuemin={0} aria-valuemax={100} aria-label={`${p.property_name} ${rate}% collected`}>
                      <div
                        className={`h-full rounded-full ${rate >= 90 ? 'bg-success' : rate >= 60 ? 'bg-warning' : 'bg-destructive'}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {gateError && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Lock className="h-5 w-5 text-warning" />
              Unlock rent-collection analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              See collected vs. expected rent by property once you upgrade to{' '}
              {capitalizeTier(gateError.required_tier)}.
            </p>
            <Button asChild>
              <Link href="/pricing">See plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
