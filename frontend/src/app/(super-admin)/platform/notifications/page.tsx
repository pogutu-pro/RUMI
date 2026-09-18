'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusPill } from '@/components/ui/status-pill';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/dashboard/page-header';
import {
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

      <Tabs defaultValue="email">
        <TabsList>
          <TabsTrigger value="email">Email templates</TabsTrigger>
          <TabsTrigger value="sms">SMS templates</TabsTrigger>
        </TabsList>

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
