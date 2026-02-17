"use client";

import * as React from 'react';
import { 
  CreditCard, 
  Check, 
  Zap, 
  Shield, 
  Headphones, 
  BarChart 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  useSubscriptionPlans, 
  useSubscriptionAccrual, 
  useSubscriptionInvoices,
} from '@/features/payments';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';
import { SubscriptionInvoice } from '@/features/payments/types';

export default function SubscriptionPage() {
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: accrual, isLoading: accrualLoading } = useSubscriptionAccrual();
  const { data: invoices, isLoading: invoicesLoading } = useSubscriptionInvoices();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Zap className="h-8 w-8 text-warning" />
            Billing & Subscription
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your real-time bed-occupancy billing and invoices.
          </p>
        </div>
      </div>

       {/* Current Accrual Card */}
       <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden relative">
           <div className="absolute top-0 right-0 p-32 bg-warning/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           <CardContent className="p-8 relative z-10">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div>
                       <div className="flex items-center gap-2 mb-2">
                           <p className="text-warning font-medium tracking-wider uppercase text-sm">Monthly Accrual</p>
                           <Badge variant="outline" className="bg-green-100 text-green-700 border-0 font-bold">Live Tracking</Badge>
                       </div>
                       <h2 className="text-4xl font-bold mb-2 text-primary">
                           {accrualLoading ? <Skeleton className="h-10 w-32 bg-slate-800" /> : `KES ${accrual?.projected_accrual?.toLocaleString() || '0'}`}
                       </h2>
                       <p className="text-muted-foreground max-w-lg">
                           Based on <strong>{accrual?.total_occupied_bed_days || 0} occupied bed-days</strong> recorded so far this month. 
                           You are only charged for beds with active students.
                       </p>
                   </div>
                   <div className="text-right">
                       <div className="text-sm font-medium text-muted-foreground mb-1">Billing Model</div>
                       <div className="text-2xl font-bold text-primary mb-1">
                           Pay-per-Occupied-Bed
                       </div>
                       <p className="text-sm text-muted-foreground">KES 29 / bed / month</p>
                   </div>
               </div>
           </CardContent>
       </Card>

       <div className="grid gap-6 md:grid-cols-3 pt-6">
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-primary" />
                        Invoice History
                    </CardTitle>
                    <CardDescription>Records of your past subscription payments</CardDescription>
                </CardHeader>
                <CardContent>
                    {invoicesLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : invoices && invoices.length > 0 ? (
                        <div className="border rounded-md">
                             <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Invoice #</th>
                                        <th className="px-4 py-3 text-left font-medium">Date</th>
                                        <th className="px-4 py-3 text-left font-medium">Amount</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((inv: SubscriptionInvoice) => (
                                        <tr key={inv.id} className="border-b transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                                            <td className="px-4 py-3">{format(new Date(inv.invoice_date), 'MMM dd, yyyy')}</td>
                                            <td className="px-4 py-3">KES {inv.total_amount}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={cn("capitalize font-bold border-0", inv.status === 'paid' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>
                                                    {inv.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm">Download</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
                            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium opacity-70">No invoices yet</h3>
                            <p className="text-sm text-muted-foreground">Invoices are generated on the 1st of every month.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="border-warning/30 bg-warning/5">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5 text-warning" />
                            Enforcement Policy
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                        <p>
                            We offer a <strong>7-day grace period</strong> for all subscription invoices.
                        </p>
                        <p>
                            If an invoice remains unpaid after <strong>14 days</strong>, your account will enter <strong>Read-Only mode</strong>.
                        </p>
                        <div className="p-3 bg-white/50 dark:bg-black/20 rounded border border-warning/20">
                            <strong>Read-Only Mode:</strong> You can view all data and receive student payments, but cannot add new rooms, hostels, or edit existing records.
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Headphones className="h-5 w-5 text-primary" />
                            Billing Support
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <p className="text-muted-foreground mb-4">
                            Have questions about your occupancy snapshots or accrual? We are here to help.
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/landlord/support">Contact Support</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
       </div>
    </div>
  );
}
