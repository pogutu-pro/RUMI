'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProperties, useUnits, useTenants, useRentBalance } from '@/features/rental/hooks/use-rental';

function formatKes(amount: string | number) {
  const n = Number(amount);
  return `KES ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function CaretakerRentalDashboard() {
  const { data: properties = [] } = useProperties();
  const { data: units = [] } = useUnits();
  const { data: tenants = [] } = useTenants();
  const { data: balance, isError: balanceForbidden } = useRentBalance();

  const occupied = units.filter((u) => u.status === 'occupied').length;
  const overdueCharges = (balance?.charges ?? []).filter((c) => c.status === 'overdue');
  const unitNumberById = new Map(units.map((u) => [u.id, u.unit_number]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Properties assigned" value={properties.length} />
        <StatCard label="Units" value={units.length} />
        <StatCard label="Occupied" value={occupied} />
        <StatCard label="Tenants" value={tenants.length} />
      </div>

      {!balanceForbidden && (
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
                    <Badge variant="destructive">{formatKes(c.outstanding)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Your properties</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No properties assigned to you yet.</p>
          ) : (
            <ul className="divide-y">
              {properties.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">{p.city}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Need to add a tenant?{' '}
        <Link href="/caretaker/rental/tenants" className="text-primary underline">
          Go to Tenants
        </Link>
      </p>
    </div>
  );
}
