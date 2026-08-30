'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTenants, useCreateTenant } from '@/features/rental/hooks/use-rental';

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  email: '',
  nok_full_name: '',
  nok_relationship: '',
  nok_phone: '',
  nok_authorized: false,
};

export default function CaretakerTenantsPage() {
  const { data: tenants = [], isLoading } = useTenants();
  const createTenant = useCreateTenant();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const handleCreate = async () => {
    const emergency_contacts = form.nok_full_name
      ? [{
          full_name: form.nok_full_name,
          relationship: form.nok_relationship,
          phone: form.nok_phone,
          is_primary: true,
          purpose: form.nok_authorized ? 'rent_escalation_authorized' : 'emergency_only',
          consent_given: form.nok_authorized,
        }]
      : [];

    await createTenant.mutateAsync({
      full_name: form.full_name,
      phone: form.phone,
      email: form.email,
      emergency_contacts,
    });
    setOpen(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tenants</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add tenant</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add tenant</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <p className="mt-1 text-xs text-muted-foreground">
                  They&apos;ll get an email to set up their password once attached to a unit.
                </p>
              </div>

              <div className="pt-2 border-t">
                <p className="mb-2 text-sm font-medium">Next of kin (optional)</p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="nok_full_name">Full name</Label>
                    <Input
                      id="nok_full_name"
                      value={form.nok_full_name}
                      onChange={(e) => setForm({ ...form, nok_full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nok_relationship">Relationship</Label>
                    <Input
                      id="nok_relationship"
                      placeholder="Parent, sibling, spouse..."
                      value={form.nok_relationship}
                      onChange={(e) => setForm({ ...form, nok_relationship: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nok_phone">Phone</Label>
                    <Input
                      id="nok_phone"
                      value={form.nok_phone}
                      onChange={(e) => setForm({ ...form, nok_phone: e.target.value })}
                    />
                  </div>
                  <label className="flex items-start gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={form.nok_authorized}
                      onChange={(e) => setForm({ ...form, nok_authorized: e.target.checked })}
                    />
                    <span>
                      Contact this person about rent if the tenant falls behind and can&apos;t be
                      reached. Off by default; only used with this consent.
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!form.full_name || createTenant.isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tenants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tenants yet — add the first one above.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.full_name}</TableCell>
                <TableCell>{t.phone}</TableCell>
                <TableCell>{t.email}</TableCell>
                <TableCell><Badge variant="secondary">{t.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
