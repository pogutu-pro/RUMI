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
import { useMySubscription, useSubscriptionPlans } from '@/features/payments';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function SubscriptionPage() {
  const { data: mySubscription, isLoading: subLoading } = useMySubscription();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();

  // Placeholder data if hook return is handled differently/empty
  const currentPlan = mySubscription?.plan || null;
  const isTrial = mySubscription?.status === 'trialing';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Zap className="h-8 w-8 text-warning" />
            Subscription
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your billing plan and unlock premium features
          </p>
        </div>
      </div>

       {/* Current Plan Card */}
       <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden relative">
           <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           <CardContent className="p-8 relative z-10">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div>
                       <div className="flex items-center gap-2 mb-2">
                           <p className="text-success font-medium tracking-wider uppercase text-sm">Current Plan</p>
                           {isTrial && <Badge className="bg-warning/20 text-warning border-0">Trial Active</Badge>}
                       </div>
                       <h2 className="text-4xl font-bold mb-2 text-primary">{currentPlan?.name || 'Free Plan'}</h2>
                       <p className="text-muted-foreground max-w-lg">
                           {currentPlan ? 'You are enjoying premium features for managing your property portfolio efficiently.' : 'Upgrade to manage more properties and access advanced reports.'}
                       </p>
                   </div>
                   <div className="text-right">
                       <div className="text-3xl font-bold text-primary mb-1">
                           KES {currentPlan?.price || '0'} <span className="text-lg font-normal text-muted-foreground">/ mo</span>
                       </div>
                       {mySubscription?.current_period_end && (
                        <p className="text-sm text-muted-foreground">Renews {format(new Date(mySubscription.current_period_end), 'MMM dd, yyyy')}</p>
                       )}
                       <div className="mt-4 flex gap-3 justify-end">
                           <Button variant="outline" className="hover:bg-accent">Manage Billing</Button>
                           <Button className="bg-success hover:bg-success/90 text-success-foreground">Upgrade Plan</Button>
                       </div>
                   </div>
               </div>
           </CardContent>
       </Card>

       {/* Plans Grid */}
       <div className="grid gap-6 md:grid-cols-3 pt-6">
           {plansLoading ? (
               Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-xl" />)
           ) : (
                plans?.map((plan: any) => (
                    <Card key={plan.id} className={cn("border-2 shadow-sm transition-all duration-200 hover:border-success/50 hover:shadow-lg", currentPlan?.id === plan.id ? 'border-success ring-1 ring-success' : 'border-transparent')}>
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-3xl font-bold">
                                KES {plan.price} <span className="text-lg font-normal text-muted-foreground">/mo</span>
                            </div>
                            <ul className="space-y-2 text-sm">
                                {plan.features?.map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-success" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant={currentPlan?.id === plan.id ? "outline" : "default"} disabled={currentPlan?.id === plan.id}>
                                {currentPlan?.id === plan.id ? 'Current Plan' : 'Select Plan'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))
           )}
           {/* Fallback if no plans loaded */}
           {!plans?.length && !plansLoading && (
               <>
                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle>Starter</CardTitle>
                        <CardDescription>For single property owners</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-4">Free</div>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success"/> 1 Property</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success"/> 5 Units</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success"/> Basic Reporting</li>
                        </ul>
                    </CardContent>
                    <CardFooter><Button variant="outline" className="w-full">Current Plan</Button></CardFooter>
                </Card>
                <Card className="border shadow-sm border-success relative">
                     <Badge className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 bg-success">Popular</Badge>
                     <CardHeader>
                        <CardTitle>Professional</CardTitle>
                        <CardDescription>For growing portfolios</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="text-3xl font-bold mb-4">KES 2,500 <span className="text-base font-normal text-muted-foreground">/mo</span></div>
                         <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success"/> Up to 5 Properties</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success"/> Unlimited Units</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success"/> Advanced Financial Reports</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success"/> Priority Support</li>
                        </ul>
                    </CardContent>
                    <CardFooter><Button className="w-full bg-success hover:bg-success/90">Upgrade</Button></CardFooter>
                </Card>
                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle>Business</CardTitle>
                        <CardDescription>For full management agencies</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="text-3xl font-bold mb-4">KES 8,000 <span className="text-base font-normal text-muted-foreground">/mo</span></div>
                         <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success"/> Unlimited Properties</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success"/> Multi-User Access</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success"/> API Access</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success"/> Dedicated Account Manager</li>
                        </ul>
                    </CardContent>
                    <CardFooter><Button variant="outline" className="w-full">Contact Sales</Button></CardFooter>
                </Card>
               </>
           )}
       </div>
    </div>
  );
}
