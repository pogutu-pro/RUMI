'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, RefreshCw, Calendar, CreditCard } from 'lucide-react';

export default function RecurringPaymentsPage() {
  const [autoPayEnabled, setAutoPayEnabled] = React.useState(false);
  const [payments, setPayments] = React.useState([
    {
      id: '1',
      name: 'Monthly Rent',
      amount: 12000,
      frequency: 'Monthly',
      nextPayment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active',
    },
    {
      id: '2',
      name: 'Electricity Bill',
      amount: 1500,
      frequency: 'Monthly',
      nextPayment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'active',
    },
    {
      id: '3',
      name: 'Water Bill',
      amount: 800,
      frequency: 'Monthly',
      nextPayment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'active',
    },
  ]);

  // TODO: Fetch from API
  const recurringPayment = {
    amount: 15000,
    frequency: 'monthly',
    nextPaymentDate: '2024-02-01',
    paymentMethod: 'M-Pesa +254 712 345 678',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/student/payments">
          <Button variant="ghost" size="sm" className="dark:border-gray-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Recurring Payments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your automatic rent payments
          </p>
        </div>
      </div>

      {/* Auto-Pay Toggle */}
      <Card className="bg-card">
        <CardContent className="flex items-center justify-between py-6">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Active Plan
            </p>
            <p className="text-sm text-muted-foreground">
              Your current auto-pay settings
            </p>
          </div>
          <Switch
            checked={autoPayEnabled}
            onCheckedChange={setAutoPayEnabled}
            className="data-[state=checked]:bg-emerald-600"
          />
        </CardContent>
      </Card>

      {/* Recurring Payment Details */}
      {autoPayEnabled && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Payment Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-medium text-foreground">
                    KES {recurringPayment.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Frequency</p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {recurringPayment.frequency}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Next Payment</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(recurringPayment.nextPaymentDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="text-sm font-medium text-foreground">
                    {recurringPayment.paymentMethod}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t dark:border-gray-700">
              <Link href="/student/payments/methods">
                <Button variant="outline" className="w-full dark:border-gray-700">
                  Change Payment Method
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> Automatic payments will be processed 3 days before the due date. 
            You'll receive a notification 5 days before each payment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
