'use client';

import { Info } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpensesTab } from './expenses-tab';
import { ExportTab } from './export-tab';
import { OverviewTab } from './overview-tab';
import { TaxTab } from './tax-tab';

/** Landlord accounting: monthly income and expenses, rental income tax (MRI) figures, and exports. Free on every plan. */
export function AccountingView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounting"
        description="Your income, your expenses and the rental income tax figure to declare each month."
      />

      <div className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Free on every plan. RumiaRent works out the figures from the rent you actually receive; <span className="font-medium text-foreground">you
          file and pay on iTax or eRITS yourself</span>. This is a preparation aid, not tax advice.
        </p>
      </div>

      <Tabs defaultValue="tax">
        <TabsList>
          <TabsTrigger value="tax">Rental income tax (monthly)</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>
        <TabsContent value="tax" className="mt-5"><TaxTab /></TabsContent>
        <TabsContent value="overview" className="mt-5"><OverviewTab /></TabsContent>
        <TabsContent value="expenses" className="mt-5"><ExpensesTab /></TabsContent>
        <TabsContent value="export" className="mt-5"><ExportTab /></TabsContent>
      </Tabs>
    </div>
  );
}
