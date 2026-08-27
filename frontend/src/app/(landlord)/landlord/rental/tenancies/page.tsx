'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useTenancies, useCreateTenancy, useTerminateTenancy, useUnits, useTenants,
} from '@/features/rental/hooks/use-rental';

export default function TenanciesPage() {
  const { data: tenancies = [], isLoading } = useTenancies();
  const { data: units = [] } = useUnits();
  const { data: tenants = [] } = useTenants();
  const createTenancy = useCreateTenancy();
  const terminateTenancy = useTerminateTenancy();

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ unit: '', tenant: '', monthly_rent: '', start_date: '' });

  const vacantUnits = units.filter((u) => u.status !== 'occupied');

  const handleCreate = async () => {
    await createTenancy.mutateAsync({
      ...form,
      status: 'active',
      start_date: form.start_date || new Date().toISOString().slice(0, 10),
    });
    setOpen(false);
    setForm({ unit: '', tenant: '', monthly_rent: '', start_date: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tenancies</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New tenancy</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New tenancy</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => {
                  const unit = units.find((u) => u.id === v);
                  setForm({ ...form, unit: v, monthly_rent: unit?.monthly_rent ?? form.monthly_rent });
                }}>
                  <SelectTrigger><SelectValue placeholder="Choose a vacant unit" /></SelectTrigger>
                  <SelectContent>
                    {vacantUnits.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tenant</Label>
                <Select value={form.tenant} onValueChange={(v) => setForm({ ...form, tenant: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose a tenant" /></SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="monthly_rent">Monthly rent (KES)</Label>
                <Input id="monthly_rent" type="number" value={form.monthly_rent}
                  onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="start_date">Start date</Label>
                <Input id="start_date" type="date" value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!form.unit || !form.tenant || !form.monthly_rent || createTenancy.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tenancies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tenancies yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenancies.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.tenant_name}</TableCell>
                <TableCell>{t.unit_number}</TableCell>
                <TableCell>KES {t.monthly_rent}</TableCell>
                <TableCell>
                  <Badge variant={t.status === 'active' ? 'default' : 'secondary'}>{t.status}</Badge>
                </TableCell>
                <TableCell>
                  {t.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={terminateTenancy.isPending}
                      onClick={() => terminateTenancy.mutate({ id: t.id })}
                    >
                      Terminate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
