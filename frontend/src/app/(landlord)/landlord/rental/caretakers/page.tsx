'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCaretakers, useCreateCaretaker, useProperties } from '@/features/rental/hooks/use-rental';

const EMPTY_FORM = {
  full_name: '',
  email: '',
  phone: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

export default function CaretakersPage() {
  const { data: caretakers = [], isLoading } = useCaretakers();
  const { data: properties = [] } = useProperties();
  const createCaretaker = useCreateCaretaker();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [propertyIds, setPropertyIds] = React.useState<string[]>([]);

  const togglePropertyId = (id: string) => {
    setPropertyIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleCreate = async () => {
    await createCaretaker.mutateAsync({ ...form, property_ids: propertyIds });
    setOpen(false);
    setForm(EMPTY_FORM);
    setPropertyIds([]);
  };

  const canSubmit =
    form.full_name.trim() &&
    form.email.trim() &&
    /^\+254[0-9]{9}$/.test(form.phone) &&
    form.emergency_contact_name.trim() &&
    /^\+254[0-9]{9}$/.test(form.emergency_contact_phone);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Caretakers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add caretaker</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add caretaker</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  They&apos;ll get an email to set up their password.
                </p>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+254712345678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="pt-2 border-t">
                <p className="mb-2 text-sm font-medium">Emergency contact</p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="ec_name">Full name</Label>
                    <Input
                      id="ec_name"
                      value={form.emergency_contact_name}
                      onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ec_phone">Phone</Label>
                    <Input
                      id="ec_phone"
                      placeholder="+254712345678"
                      value={form.emergency_contact_phone}
                      onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {properties.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="mb-2 text-sm font-medium">Assign to properties</p>
                  <div className="space-y-2">
                    {properties.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={propertyIds.includes(p.id)}
                          onCheckedChange={() => togglePropertyId(p.id)}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!canSubmit || createCaretaker.isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : caretakers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No caretakers yet — add the first one above.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {caretakers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>
                  {c.assigned_properties.length === 0
                    ? <span className="text-muted-foreground">None</span>
                    : c.assigned_properties.map((p) => p.name).join(', ')}
                </TableCell>
                <TableCell>
                  <Badge variant={c.is_active ? 'default' : 'secondary'}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
