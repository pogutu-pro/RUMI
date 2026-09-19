'use client';

import * as React from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Pencil, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PriceDisplay } from '@/components/ui/price-display';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormDialogActions, FormRow, FormSection } from '@/components/ui/form-layout';
import { PageHeader } from '@/components/dashboard/page-header';
import { useAdminPlans, useUpdateAdminPlan } from '@/features/admin-billing/hooks/use-admin-billing';
import type { AdminPlan } from '@/features/admin-billing/types';

const limit = z.coerce.number().int('Whole numbers only').min(0, 'Use 0 for unlimited').max(100000);

const planSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  price: z.coerce.number().min(1, 'Price must be at least KES 1').max(1_000_000, 'That is above the KES 1,000,000 limit'),
  max_properties: limit,
  max_units: limit,
  max_caretaker_seats: limit,
  analytics: z.boolean(),
});

type PlanInput = z.input<typeof planSchema>;
type PlanOutput = z.output<typeof planSchema>;

const unlimited = (n: number, noun: string) => (n === 0 ? `Unlimited ${noun}` : `${n} ${noun}`);

function EditPlanDialog({ plan, onClose }: { plan: AdminPlan | null; onClose: () => void }) {
  const update = useUpdateAdminPlan();
  const form = useForm<PlanInput, unknown, PlanOutput>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '', price: '', max_properties: 0, max_units: 0, max_caretaker_seats: 0,
      analytics: false,
    },
  });

  React.useEffect(() => {
    if (!plan) return;
    form.reset({
      name: plan.name,
      price: String(Number(plan.price)),
      max_properties: plan.max_properties,
      max_units: plan.max_units,
      max_caretaker_seats: plan.max_caretaker_seats,
      analytics: !!plan.features.analytics,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const onSubmit = form.handleSubmit(async (v) => {
    if (!plan) return;
    try {
      const result = await update.mutateAsync({
        id: plan.id,
        payload: {
          name: v.name,
          price: v.price,
          max_properties: v.max_properties,
          max_units: v.max_units,
          max_caretaker_seats: v.max_caretaker_seats,
          features: { analytics: v.analytics },
        },
      });
      toast.success(`${result.name} updated. The public site and landlord pages now show it.`);
      const sync = result.paystack_sync;
      if (sync.status === 'failed') toast.error(sync.detail ?? 'Paystack was not updated.');
      else if (sync.status === 'skipped' || sync.status === 'updated') toast.message(sync.detail ?? '');
      onClose();
    } catch (err) {
      toast.error((err as { message?: string })?.message || 'Could not save the plan');
    }
  });

  return (
    <Dialog open={!!plan} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit {plan?.name}</DialogTitle>
          <DialogDescription>
            Changes go live on the public site, the landlord billing page and onboarding straight away. People who
            already subscribe keep the price they signed up at.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            <FormRow>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan name</FormLabel>
                    <FormControl><Input className="h-11" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per month (KES)</FormLabel>
                    <FormControl>
                      <Input className="h-11" type="number" inputMode="decimal" min="1" step="any" {...field} value={field.value as string | number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormRow>

            <FormSection title="Limits" description="Enter 0 for unlimited.">
              <div className="grid gap-5 sm:grid-cols-3">
                {([
                  ['max_properties', 'Properties'],
                  ['max_units', 'Units'],
                  ['max_caretaker_seats', 'Caretaker seats'],
                ] as const).map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input className="h-11" type="number" inputMode="numeric" min="0" step="1" {...field} value={field.value as string | number} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </FormSection>

            <FormSection title="Features">
              <FormField
                control={form.control}
                name="analytics"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">Analytics</FormLabel>
                      <FormDescription>
                        The income summary on the landlord dashboard: expected, collected, outstanding and overdue rent,
                        collection rate and a breakdown per property.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </FormSection>

            <FormDialogActions submitLabel="Save changes" isPending={update.isPending} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPlansPage() {
  const { data: plans = [], isLoading } = useAdminPlans();
  const [editing, setEditing] = React.useState<AdminPlan | null>(null);

  return (
    <div className="space-y-6">
      <Link
        href="/platform/billing"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Billing
      </Link>
      <PageHeader
        title="Plans and pricing"
        description="What landlords pay RumiaRent. Edits appear on the homepage, the pricing page and every landlord's billing page."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="flex flex-col rounded-2xl border bg-background p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
                  <PriceDisplay amount={plan.price} size="lg" showDecimals={false} />
                  <span className="text-xs text-muted-foreground">per month</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditing(plan)} leftIcon={<Pencil className="h-3.5 w-3.5" />}>
                  Edit
                </Button>
              </div>

              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <li>{unlimited(plan.max_properties, plan.max_properties === 1 ? 'property' : 'properties')}</li>
                <li>{unlimited(plan.max_units, plan.max_units === 1 ? 'unit' : 'units')}</li>
                <li>{unlimited(plan.max_caretaker_seats, plan.max_caretaker_seats === 1 ? 'caretaker seat' : 'caretaker seats')}</li>
                <li>Analytics: {plan.features.analytics ? 'included' : 'not included'}</li>
              </ul>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" /> {plan.active_subscribers} subscribed
                </Badge>
                <Badge variant={plan.paystack_linked ? 'default' : 'outline'}>
                  {plan.paystack_linked ? 'Linked to Paystack' : 'Not linked to Paystack'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditPlanDialog plan={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
