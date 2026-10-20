'use client';

import * as React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/dashboard/page-header';
import { useProperties } from '@/features/rental/hooks/use-rental';
import { useDownloadStatement, useStatement } from '@/features/accounting/hooks';
import { formatDate, formatKes } from '@/features/ledger/lib/format';

const thisMonth = () => new Date().toISOString().slice(0, 7);
const ALL = 'all';

export default function StatementsPage() {
  const [month, setMonth] = React.useState(thisMonth());
  const [property, setProperty] = React.useState(ALL);
  const propertyId = property === ALL ? undefined : property;
  const { data: properties = [] } = useProperties();
  const { data: s, isLoading, isError } = useStatement(month, propertyId);
  const download = useDownloadStatement();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statements"
        description="What came in, what went out, and what every tenant owes — straight from your books."
        action={
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            isLoading={download.isPending}
            onClick={() => download.mutate({ month, propertyId })}
          >
            Download PDF
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Input type="month" className="w-44" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
        <Select value={property} onValueChange={setProperty}>
          <SelectTrigger className="w-56" aria-label="Property"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All properties</SelectItem>
            {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : isError || !s ? (
        <p className="text-sm text-destructive">Could not load the statement.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Tile label="Money received" value={formatKes(s.cash.received_total)} />
            <Tile label="Expenses" value={formatKes(s.cash.expenses_total)} />
            <Tile label="Net cash" value={formatKes(s.cash.net_cash)} strong />
            {Number(s.owed_closing) < 0 ? (
              <Tile label="Tenants in credit (end of month)" value={formatKes(-Number(s.owed_closing))} />
            ) : (
              <Tile label="Tenants owe (end of month)" value={formatKes(s.owed_closing)} />
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Money in and out</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                {Object.entries(s.cash.received_by_channel).map(([channel, amount]) => (
                  <Line key={channel} label={`Received · ${channel}`} value={formatKes(amount, { cents: true })} />
                ))}
                {Object.keys(s.cash.received_by_channel).length === 0 && <p className="text-muted-foreground">Nothing received.</p>}
                {Number(s.cash.deposits_refunded) > 0 && <Line label="Deposits refunded" value={`− ${formatKes(s.cash.deposits_refunded, { cents: true })}`} />}
                {Object.entries(s.expenses_by_category).map(([category, amount]) => (
                  <Line key={category} label={category} value={`− ${formatKes(amount, { cents: true })}`} />
                ))}
                <Line label="Net cash" value={formatKes(s.cash.net_cash, { cents: true })} strong />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Earned this month</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                {Object.entries(s.income_by_type).map(([type, amount]) => (
                  <Line key={type} label={type} value={formatKes(amount, { cents: true })} />
                ))}
                {Number(s.waivers) > 0 && <Line label="Waived / discounted" value={`− ${formatKes(s.waivers, { cents: true })}`} />}
                <Line label="Deposits held at month end" value={formatKes(s.deposits_held_closing, { cents: true })} />
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-2 font-medium">Tenant balances · {formatDate(s.period_start)} – {formatDate(s.period_end)}</h2>
            {s.tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tenant activity this month.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-right">Opening</TableHead>
                      <TableHead className="text-right">Invoiced</TableHead>
                      <TableHead className="text-right">Credited</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">From deposit</TableHead>
                      <TableHead className="text-right">Closing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {s.tenants.map((r) => (
                      <TableRow key={r.tenancy_id}>
                        <TableCell>{r.unit_number}<span className="block text-xs text-muted-foreground">{r.property_name}</span></TableCell>
                        <TableCell>{r.tenant_name}</TableCell>
                        <TableCell className="text-right">{formatKes(r.opening)}</TableCell>
                        <TableCell className="text-right">{formatKes(r.invoiced)}</TableCell>
                        <TableCell className="text-right">{formatKes(r.credited)}</TableCell>
                        <TableCell className="text-right">{formatKes(r.paid)}</TableCell>
                        <TableCell className="text-right">{formatKes(r.paid_from_deposit)}</TableCell>
                        <TableCell className={`text-right font-medium ${Number(r.closing) > 0 ? 'text-destructive' : ''}`}>
                          {formatKes(r.closing)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">{formatKes(s.owed_opening)}</TableCell>
                      <TableCell colSpan={4} />
                      <TableCell className="text-right">{formatKes(s.owed_closing)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">A negative balance means the tenant is in credit.</p>
          </div>
        </>
      )}
    </div>
  );
}

function Tile({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-xl ${strong ? 'font-bold' : 'font-semibold'}`}>{value}</p>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? 'border-t pt-1 font-semibold' : ''}`}>
      <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
