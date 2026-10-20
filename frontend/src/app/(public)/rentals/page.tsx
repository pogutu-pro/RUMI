'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listingsApi, type Listing } from '@/features/listings/api';
import { apiErrorMessage, formatKes } from '@/features/ledger/lib/format';

const TYPES = [['', 'Any type'], ['bedsitter', 'Bedsitter'], ['studio', 'Studio'], ['1_bedroom', '1 bedroom'],
  ['2_bedroom', '2 bedrooms'], ['3_bedroom', '3 bedrooms'], ['house', 'House']];

export default function RentalsPage() {
  const [city, setCity] = React.useState('');
  const [type, setType] = React.useState('');
  const [maxRent, setMaxRent] = React.useState('');
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [enquiring, setEnquiring] = React.useState<Listing | null>(null);
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => listingsApi.search(filters),
  });
  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(Object.fromEntries(Object.entries({ city, unit_type: type, max_rent: maxRent }).filter(([, v]) => v)));
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-muted/30 px-4 py-12">
        <div className="container mx-auto max-w-5xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary sm:text-4xl">Find a place to rent</h1>
            <p className="mt-2 text-muted-foreground">Vacant units from landlords and agents on RumiaRent — updated the moment a unit is let.</p>
          </div>
          <form onSubmit={search} className="grid gap-2 rounded-2xl border bg-background p-3 shadow-sm sm:grid-cols-[1fr_12rem_10rem_auto]">
            <Input aria-label="Town or area" placeholder="Town or county, e.g. Nairobi" value={city} onChange={(e) => setCity(e.target.value)} />
            <Select value={type || 'any'} onValueChange={(v) => setType(v === 'any' ? '' : v)}>
              <SelectTrigger aria-label="Unit type"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map(([v, l]) => <SelectItem key={v || 'any'} value={v || 'any'}>{l}</SelectItem>)}</SelectContent>
            </Select>
            <Input aria-label="Maximum rent" type="number" min="0" placeholder="Max rent (KES)" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} />
            <Button type="submit" leftIcon={<Search className="h-4 w-4" />}>Search</Button>
          </form>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-8">
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : listings.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No vacant units match. Try a wider area or a higher budget.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{listings.length} {listings.length === 1 ? 'unit' : 'units'} available</p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <li key={l.id}>
                  <Card className="flex h-full flex-col overflow-hidden rounded-2xl">
                    <div className={`flex items-center justify-center bg-muted ${l.images.length ? 'aspect-[4/3]' : 'h-28'}`}>
                      {l.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.images[0]} alt={`${l.unit_type} at ${l.property_name}`} className="h-full w-full object-cover" loading="lazy" />
                      ) : <Building2 className="h-10 w-10 text-muted-foreground" aria-hidden="true" />}
                    </div>
                    <CardContent className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold">{l.unit_type}</p>
                        <p className="whitespace-nowrap font-semibold text-primary">{formatKes(l.monthly_rent)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                      </div>
                      <p className="text-sm">{l.property_name}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{[l.city, l.county].filter(Boolean).join(', ')}</p>
                      {l.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1">{l.amenities.slice(0, 4).map((a) => <Badge key={a} variant="outline">{a}</Badge>)}</div>
                      )}
                      <p className="text-xs text-muted-foreground">Deposit {formatKes(l.deposit)} · listed by {l.listed_by}</p>
                      <Button className="mt-auto" variant="outline" onClick={() => setEnquiring(l)}>Ask about this unit</Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <EnquiryDialog listing={enquiring} onClose={() => setEnquiring(null)} />
    </div>
  );
}

function EnquiryDialog({ listing, onClose }: { listing: Listing | null; onClose: () => void }) {
  const [form, setForm] = React.useState({ name: '', phone: '', email: '', message: '' });
  React.useEffect(() => setForm({ name: '', phone: '', email: '', message: 'Is this still available? When can I view it?' }), [listing]);
  const send = useMutation({
    mutationFn: () => listingsApi.enquire(listing!.id, form),
    onSuccess: () => { toast.success('Sent — the landlord will contact you.'); onClose(); },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not send your enquiry')),
  });
  return (
    <Dialog open={!!listing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{listing?.unit_type} at {listing?.property_name}</DialogTitle>
          <DialogDescription>Your details go only to the landlord of this unit.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label htmlFor="enq-name">Name</Label><Input id="enq-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="enq-phone">Phone</Label><Input id="enq-phone" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-1 sm:col-span-2"><Label htmlFor="enq-msg">Message</Label><Textarea id="enq-msg" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => send.mutate()} isLoading={send.isPending} disabled={!form.name.trim() || form.phone.replace(/\D/g, '').length < 9}>Send enquiry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
