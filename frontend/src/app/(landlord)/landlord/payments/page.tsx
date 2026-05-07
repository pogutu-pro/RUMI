'use client';

import * as React from 'react';
import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { useLandlordHostels } from '@/features/hostels/hooks/use-hostels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SubscriptionOverviewCard } from '@/features/payments/components/subscription-overview-card';
import { InvoiceHistoryList } from '@/features/payments/components/invoice-history-list';

export default function LandlordPaymentsPage() {
  const { user } = useAuth();
  const [selectedHostel, setSelectedHostel] = useState<string>('');

  const { data: hostelsData } = useLandlordHostels();
  const hostels = hostelsData?.results || [];

  // Auto-select first hostel
  React.useEffect(() => {
    if (hostels && hostels.length > 0 && !selectedHostel) {
      setSelectedHostel(String(hostels[0].id));
    }
  }, [hostels, selectedHostel]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Payments & Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage subscriptions, invoices, and payment configuration
          </p>
        </div>
      </div>

      {/* Hostel Selector */}
      {hostels && hostels.length > 1 && (
        <div className="w-full sm:w-64">
          <Select value={selectedHostel} onValueChange={setSelectedHostel}>
            <SelectTrigger>
              <SelectValue placeholder="Select hostel" />
            </SelectTrigger>
            <SelectContent>
              {hostels.map((hostel: any) => (
                <SelectItem key={hostel.id} value={String(hostel.id)}>
                  {hostel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedHostel && (
        <>
          {/* Subscription Overview */}
          <SubscriptionOverviewCard hostelId={selectedHostel} />

          {/* Invoice History */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceHistoryList hostelId={selectedHostel} />
            </CardContent>
          </Card>
        </>
      )}

      {(!hostels || hostels.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hostels found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
