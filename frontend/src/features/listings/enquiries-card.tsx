'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/features/ledger/lib/format';
import { listingsApi } from './api';

/** New enquiries from the public rentals page, newest first. */
export function EnquiriesCard() {
  const qc = useQueryClient();
  const { data: enquiries = [] } = useQuery({ queryKey: ['listings', 'enquiries'], queryFn: listingsApi.enquiries });
  const handled = useMutation({
    mutationFn: listingsApi.markHandled,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['listings', 'enquiries'] }); qc.invalidateQueries({ queryKey: ['attention'] }); },
  });
  const open = enquiries.filter((e) => !e.handled);
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Rental enquiries {open.length > 0 && <span className="text-primary">({open.length} new)</span>}</CardTitle>
        <Link href="/rentals" target="_blank" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          See your public listings <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">No new enquiries. Vacant units are advertised automatically and removed once let.</p>
        ) : (
          <ul className="divide-y">
            {open.slice(0, 8).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-medium">{e.name}</span> · {e.unit}, {e.property}
                  {e.message && <span className="block text-muted-foreground">“{e.message}”</span>}
                  <span className="block text-xs text-muted-foreground">{formatDate(e.created_at)}</span>
                </span>
                <span className="flex gap-1">
                  <Button asChild size="sm" variant="outline" leftIcon={<Phone className="h-4 w-4" />}>
                    <a href={`tel:${e.phone}`}>{e.phone}</a>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handled.mutate(e.id)}>Done</Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
