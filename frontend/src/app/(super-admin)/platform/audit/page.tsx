'use client';

import * as React from 'react';
import { StatusPill } from '@/components/ui/status-pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuditLogList } from '@/features/admin-audit/hooks/use-admin-audit';

const ACTION_OPTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'tenant_created', label: 'Tenant created' },
  { value: 'tenancy_created', label: 'Tenancy created' },
  { value: 'tenancy_terminated', label: 'Tenancy terminated' },
  { value: 'rent_modified', label: 'Rent modified' },
  { value: 'payment_recorded', label: 'Payment recorded' },
  { value: 'payment_edited', label: 'Payment edited' },
  { value: 'payment_reversed', label: 'Payment reversed' },
  { value: 'payment_deleted', label: 'Payment deleted' },
  { value: 'permission_changed', label: 'Permission changed' },
  { value: 'payout_pending_verification', label: 'Payout pending verification' },
  { value: 'payout_activated', label: 'Payout activated' },
  { value: 'subscription_activated', label: 'Subscription activated' },
  { value: 'subscription_payment_recorded', label: 'Subscription payment recorded' },
  { value: 'subscription_payment_failed', label: 'Subscription payment failed' },
  { value: 'subscription_disabled', label: 'Subscription disabled' },
];

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

export default function AdminAuditLogPage() {
  const [action, setAction] = React.useState('all');
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isError, refetch } = useAuditLogList({
    action: action === 'all' ? undefined : action,
    page,
  });

  const rows = data?.results ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Every financial and administrative action taken on the platform, immutable and time-ordered." />

      <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
        <SelectTrigger className="h-11 w-full sm:w-72">
          <SelectValue placeholder="All actions" />
        </SelectTrigger>
        <SelectContent>
          {ACTION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState variant="default" title="No audit entries yet" description="Actions will appear here as they happen across the platform." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <StatusPill status="neutral">{formatAction(entry.action)}</StatusPill>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{entry.actor_email ?? 'System'}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.organization_name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.entity_type ? `${entry.entity_type} #${entry.entity_id}` : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString('en-KE', {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Page {page} · {data?.count ?? 0} total entries</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={!data?.previous}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!data?.next}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
