'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/page-header';
import { useProperties } from '@/features/rental/hooks/use-rental';
import { PenaltyPolicyForm } from '@/features/ledger/components/penalty-policy-form';
import { UtilityRatesForm } from '@/features/ledger/components/utility-rates-form';

export default function RentRulesPage() {
  const { data: properties = [], isLoading } = useProperties();

  return (
    <div className="space-y-6">
      <PageHeader title="Rent rules" description="How late penalties and metered utilities are charged." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Late penalties</CardTitle>
          <CardDescription>
            Reminders go out automatically before and after the due date either way. Penalties are optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PenaltyPolicyForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Water and electricity rates</CardTitle>
          <CardDescription>
            Price per unit used when you record a meter reading (Tenancies → Money → Meters).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a property first.</p>
          ) : (
            properties.map((p) => <UtilityRatesForm key={p.id} propertyId={p.id} propertyName={p.name} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
