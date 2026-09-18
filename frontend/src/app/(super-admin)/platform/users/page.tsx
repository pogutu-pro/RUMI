'use client';

import * as React from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { StatusPill, type StatusPillProps } from '@/components/ui/status-pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { PageHeader } from '@/components/dashboard/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useAdminUserList,
  useDeactivateUser,
  useReactivateUser,
} from '@/features/admin-users/hooks/use-admin-users';
import type { AdminUserRow } from '@/features/admin-users/types';

type PillStatus = NonNullable<StatusPillProps['status']>;

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'caretaker', label: 'Caretaker' },
  { value: 'tech_support', label: 'Tech Support' },
  { value: 'super_admin', label: 'Super Admin' },
];

const ROLE_LABEL: Record<string, string> = {
  tenant: 'Tenant',
  landlord: 'Landlord',
  caretaker: 'Caretaker',
  tech_support: 'Tech Support',
  tech_support_admin: 'Tech Support',
  super_admin: 'Super Admin',
  student: 'Tenant',
};

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const [search, setSearch] = React.useState('');
  const [role, setRole] = React.useState('all');
  const [offset, setOffset] = React.useState(0);
  const [pendingDeactivate, setPendingDeactivate] = React.useState<AdminUserRow | null>(null);

  const { data, isLoading, isError, refetch } = useAdminUserList({
    search: search || undefined,
    role: role === 'all' ? undefined : role,
    limit: PAGE_SIZE,
    offset,
  });
  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();

  const rows = data?.users ?? [];
  const total = data?.total_users ?? 0;
  const hasMore = offset + rows.length < total;

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Every account on the platform, across every role." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput onSearch={(q) => { setSearch(q); setOffset(0); }} placeholder="Search by name or email…" debounceTime={300} />
        </div>
        <Select value={role} onValueChange={(v) => { setRole(v); setOffset(0); }}>
          <SelectTrigger className="h-11 w-full sm:w-48">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : rows.length === 0 ? (
        search || role !== 'all' ? (
          <EmptyState variant="search" title="No users found" description="Try a different search term or role filter." />
        ) : (
          <EmptyState variant="default" title="No users yet" description="Users will appear here once people sign up." />
        )
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <StatusPill status="neutral">{ROLE_LABEL[user.role] ?? user.role}</StatusPill>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={(user.is_active ? 'success' : 'danger') as PillStatus}>
                      {user.is_active ? 'Active' : 'Deactivated'}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.date_joined).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingDeactivate(user)}
                        disabled={user.role === 'super_admin'}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reactivate.mutate(user.user_id)}
                        disabled={reactivate.isPending}
                      >
                        Reactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {rows.length} of {total}</span>
            {hasMore && (
              <Button variant="outline" size="sm" onClick={() => setOffset(offset + PAGE_SIZE)}>
                Load more
              </Button>
            )}
          </div>
        </>
      )}

      <ConfirmationDialog
        isOpen={!!pendingDeactivate}
        onClose={() => setPendingDeactivate(null)}
        onConfirm={() => {
          if (pendingDeactivate) {
            deactivate.mutate({ userId: pendingDeactivate.user_id, reason: 'Deactivated by super admin via dashboard' });
          }
        }}
        title="Deactivate this account?"
        description={`${pendingDeactivate?.full_name ?? 'This user'} will be logged out and unable to sign back in until reactivated.`}
        confirmText="Deactivate"
        variant="danger"
        isConfirming={deactivate.isPending}
      />
    </div>
  );
}
