'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProperties, useUnits, useRentBalance } from '@/features/rental/hooks/use-rental';

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function LandlordRentalDashboard() {
  const { data: properties = [] } = useProperties();
  const { data: units = [] } = useUnits();
  const { data: balance } = useRentBalance();

  const occupied = units.filter((u) => u.status === 'occupied').length;
  const vacant = units.filter((u) => u.status === 'vacant').length;
  const overdueCharges = (balance?.charges ?? []).filter((c) => c.status === 'overdue');
  const unitNumberById = new Map(units.map((u) => [u.id, u.unit_number]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Properties" value={properties.length} />
        <StatCard label="Occupied units" value={occupied} />
        <StatCard label="Vacant units" value={vacant} />
        <StatCard label="Outstanding rent" value={`KES ${balance?.outstanding_total ?? '0.00'}`} />
      </div>

      <Card>
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
                    <Badge variant="destructive">KES {c.outstanding}</Badge>
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
