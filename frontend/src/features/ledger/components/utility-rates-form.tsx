'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveUtilityRates, useUtilityRates } from '../hooks/use-ledger';

/** Default KES-per-unit rates for one property, used when a meter reading is recorded. */
export function UtilityRatesForm({ propertyId, propertyName }: { propertyId: string; propertyName: string }) {
  const { data: rates } = useUtilityRates(propertyId);
  const save = useSaveUtilityRates(propertyId);
  const [water, setWater] = React.useState('');
  const [electricity, setElectricity] = React.useState('');

  React.useEffect(() => {
    setWater(rates?.water ?? '');
    setElectricity(rates?.electricity ?? '');
  }, [rates]);

  return (
    <div className="grid items-end gap-3 rounded-md border p-3 sm:grid-cols-[1fr_9rem_9rem_auto]">
      <p className="font-medium">{propertyName}</p>
      <div className="space-y-1">
        <Label htmlFor={`water-${propertyId}`} className="text-xs">Water / unit</Label>
        <Input id={`water-${propertyId}`} type="number" min="0" placeholder="KES" value={water} onChange={(e) => setWater(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`power-${propertyId}`} className="text-xs">Electricity / unit</Label>
        <Input id={`power-${propertyId}`} type="number" min="0" placeholder="KES" value={electricity} onChange={(e) => setElectricity(e.target.value)} />
      </div>
      <Button
        size="sm"
        variant="outline"
        isLoading={save.isPending}
        onClick={() => save.mutate({ ...(water ? { water } : {}), ...(electricity ? { electricity } : {}) })}
      >
        Save
      </Button>
    </div>
  );
}
