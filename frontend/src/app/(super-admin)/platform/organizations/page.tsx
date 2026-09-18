'use client';

import { PageHeader } from '@/components/dashboard/page-header';
import { OrganizationsTable } from '@/features/admin-billing/components/organizations-table';

export default function AdminOrganizationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Organizations" description="Every landlord organization on the platform." />
      <OrganizationsTable />
    </div>
  );
}
