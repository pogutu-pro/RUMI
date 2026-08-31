'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useProperties,
  useUnits,
  useRentBalance,
  useIncomeSummary,
} from '@/features/rental/hooks/use-rental';
import { isGateRejection, capitalizeTier } from '@/lib/api/gate';

function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function formatKes(amount: string | number) {
  const n = Number(amount);
  return `KES ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export default function LandlordRentalDashboard() {
  const { data: properties = [] } = useProperties();
  const { data: units = [] } = useUnits();
  const { data: balance } = useRentBalance();
  const { data: income, error: incomeError } = useIncomeSummary();

  const occupied = units.filter((u) => u.status === 'occupied').length;
  const vacant = units.filter((u) => u.status === 'vacant').length;
  const overdueCharges = (balance?.charges ?? []).filter((c) => c.status === 'overdue');
  const unitNumberById = new Map(units.map((u) => [u.id, u.unit_number]));
  const collectionRate = income ? Math.round(Number(income.summary.collection_rate)) : null;
  const gateError = isGateRejection(incomeError);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Properties" value={properties.length} />
        <StatCard label="Occupied units" value={occupied} />
        <StatCard label="Vacant units" value={vacant} />
        <StatCard
          label="Outstanding rent"
          value={formatKes(balance?.outstanding_total ?? '0')}
        />
      </div>

      {income && !gateError && (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Rent collected this month</CardTitle>
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
          <CardContent className="space-y-4">
            <p className="text-2xl font-semibold">
              {formatKes(income.summary.collected_rent)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                of {formatKes(income.summary.expected_rent)} expected
              </span>
            </p>

            {income.by_property.length > 0 && (
              <ul className="divide-y rounded-xl border">
                {income.by_property.map((p) => (
                  <li key={p.property_id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="font-medium">{p.property_name}</span>
                    <span className="text-muted-foreground">
                      {formatKes(p.collected_rent)} / {formatKes(p.expected_rent)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {gateError && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
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

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Needs attention — overdue rent</CardTitle>
        </CardHeader>
        <CardContent>
          {overdueCharges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing overdue right now.</p>
          ) : (
            <ul className="divide-y">
              {overdueCharges.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    Unit {unitNumberById.get(c.unit) ?? c.unit} — due {c.due_date}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="destructive">{formatKes(c.outstanding)}</Badge>
                    <Link href="/landlord/rental/rent" className="text-primary underline">
                      View
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
