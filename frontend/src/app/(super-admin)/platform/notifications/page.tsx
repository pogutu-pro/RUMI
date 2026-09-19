'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusPill } from '@/components/ui/status-pill';
import { formatDistanceToNow } from 'date-fns';
import { Mail, MessageSquare } from 'lucide-react';
import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  useAdminDeliveries,
  useAdminEmailTemplates,
  useAdminNotificationStats,
  useAdminSmsTemplates,
} from '@/features/admin-notifications/hooks/use-admin-notifications';

function StatCard({ title, value, loading }: { title: string; value: React.ReactNode; loading?: boolean }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div className="skeleton h-8 w-20 rounded-lg" /> : <p className="text-2xl font-bold text-foreground">{value}</p>}
      </CardContent>
    </Card>
  );
}

type DeliveryFilter = 'all' | 'failed';

function DeliveryLog() {
  const [filter, setFilter] = React.useState<DeliveryFilter>('all');
  const { data: rows = [], isLoading } = useAdminDeliveries(filter === 'failed' ? { status: 'failed' } : undefined);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['all', 'failed'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === f ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {f === 'all' ? 'All deliveries' : 'Failed only'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {filter === 'failed'
            ? 'No failed deliveries. Everything sent has been accepted.'
            : 'Nothing has been sent since delivery logging was switched on. New emails and SMS will appear here.'}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    {row.channel === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                    {row.channel === 'email' ? 'Email' : 'SMS'}
                  </span>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{row.recipient_name || row.recipient_address}</p>
                  {row.recipient_name && <p className="text-xs text-muted-foreground">{row.recipient_address}</p>}
                </TableCell>
                <TableCell className="text-muted-foreground">{row.subject || 'Text message'}</TableCell>
                <TableCell>
                  {row.status === 'sent' ? (
                    <StatusPill status="success">Sent</StatusPill>
                  ) : (
                    <div>
                      <StatusPill status="danger">Failed</StatusPill>
                      {row.error_message && (
                        <p className="mt-1 max-w-xs text-xs text-muted-foreground">{row.error_message}</p>
                      )}
                    </div>
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

export default function AdminNotificationsPage() {
  const { data: stats, isLoading: statsLoading } = useAdminNotificationStats();
  const { data: emailData, isLoading: emailLoading } = useAdminEmailTemplates();
  const { data: smsData, isLoading: smsLoading } = useAdminSmsTemplates();

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Delivery performance over the last 30 days, and the templates behind every email and SMS." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Sent (30 days)" value={stats?.total_notifications ?? 0} loading={statsLoading} />
        <StatCard
          title="Delivery rate"
          value={`${(stats?.delivery_rate ?? 0).toFixed(1)}%`}
          loading={statsLoading}
        />
        <StatCard title="Email sent" value={stats?.by_channel.email ?? 0} loading={statsLoading} />
        <StatCard title="SMS sent" value={stats?.by_channel.sms ?? 0} loading={statsLoading} />
      </div>

      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log">Delivery log</TabsTrigger>
          <TabsTrigger value="email">Email templates</TabsTrigger>
          <TabsTrigger value="sms">SMS templates</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-4">
          <DeliveryLog />
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          {emailLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Variables</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(emailData?.templates ?? []).map((t) => (
                  <TableRow key={t.template_id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.subject}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {t.variables.map((v) => (
                          <StatusPill key={v} status="neutral">{v}</StatusPill>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="sms" className="mt-4">
          {smsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Variables</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(smsData?.templates ?? []).map((t) => (
                  <TableRow key={t.template_id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.message}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {t.variables.map((v) => (
                          <StatusPill key={v} status="neutral">{v}</StatusPill>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
