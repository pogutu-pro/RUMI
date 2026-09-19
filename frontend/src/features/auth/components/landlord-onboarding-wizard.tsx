'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { axiosInstance as axios } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Steps } from '@/components/ui/steps';
import { PriceDisplay } from '@/components/ui/price-display';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useOnboardingStatus } from '@/features/auth/hooks/use-auth';
import { useCreateOrganization, useCreateProperty } from '@/features/rental/hooks/use-rental';
import { usePayoutStatus } from '@/features/payout/hooks/use-payout';
import { PayoutDetailsForm } from '@/features/payout/components/payout-details-form';
import { usePlans } from '@/features/billing/hooks/use-plans';
import { useBillingAccess } from '@/features/billing/hooks/use-subscription';
import {
  wizardOrgSchema,
  wizardPropertySchema,
  type WizardOrgFormData,
  type WizardPropertyFormData,
} from '@/lib/validations/auth.schema';

const WIZARD_STEPS = [
  { title: 'Organization' },
  { title: 'Property' },
  { title: 'Payout' },
  { title: 'Plan' },
];

function clampStep(step: number): number {
  return Math.min(4, Math.max(1, step));
}

/**
 * 4-step resumable landlord onboarding wizard (org -> property -> payout ->
 * tier), replacing the brutalist 2-step landlord branch of onboarding-form.tsx
 * (D-01, D-02). Resumability is a read of server state (useOnboardingStatus's
 * `wizard` block, Phase 4 Plan 01), not a client-local draft replay. Each
 * step persists real data immediately via its own endpoint (org/property/
 * payout/tier) — resumability never depends on a client-side draft replay.
 */
export function LandlordOnboardingWizard() {
  const router = useRouter();
  const { data, isLoading: isLoadingStatus } = useOnboardingStatus();

  // Local step state overrides the server-derived step only after the
  // landlord advances a step client-side; until then the effective step is
  // computed directly from server data on every render, so there is no
  // one-frame flash back to step 1 while the status query resolves.
  const [manualStep, setManualStep] = useState<number | null>(null);
  const serverStep = data?.wizard ? clampStep(data.wizard.current_step) : 1;
  const step = manualStep ?? serverStep;
  const showResumeBanner = manualStep === null && serverStep > 1;

  const goToStep = (next: number) => setManualStep(clampStep(next));

  // Wizard already complete (current_step === 5, e.g. a landlord navigating
  // back to /onboarding after finishing) — redirect immediately, never
  // rendering the step cards first.
  useEffect(() => {
    if (data?.wizard?.current_step === 5) {
      router.replace('/landlord/rental');
    }
  }, [data, router]);

  if (isLoadingStatus) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data?.wizard?.current_step === 5) {
    return null;
  }

  return (
    <div className="space-y-8">
      <Steps steps={WIZARD_STEPS} currentStep={step - 1} />

      {showResumeBanner && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4 text-sm font-semibold text-primary">
          Welcome back — pick up where you left off.
        </div>
      )}

      {step === 1 && (
        <OrgStep
          organizationName={data?.wizard?.organization_name ?? null}
          onAdvance={() => goToStep(2)}
        />
      )}
      {step === 2 && (
        <PropertyStep
          organizationName={data?.wizard?.organization_name ?? null}
          onAdvance={() => goToStep(3)}
          onBack={() => goToStep(1)}
        />
      )}
      {step === 3 && <PayoutStep onAdvance={() => goToStep(4)} onBack={() => goToStep(2)} />}
      {step === 4 && <TierStep onBack={() => goToStep(3)} />}
    </div>
  );
}

function OrgStep({
  organizationName,
  onAdvance,
}: {
  organizationName: string | null;
  onAdvance: () => void;
}) {
  const createOrganization = useCreateOrganization();
  const form = useForm<WizardOrgFormData>({
    resolver: zodResolver(wizardOrgSchema),
    defaultValues: { name: organizationName ?? '' },
  });

  const onSubmit = async (values: WizardOrgFormData) => {
    try {
      await createOrganization.mutateAsync(values);
      onAdvance();
    } catch {
      // Error toast already surfaced by useCreateOrganization's onError —
      // stay on this step so the landlord can retry without losing input.
    }
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
      <h2 className="mb-6 text-2xl font-semibold text-gray-900">Set up your organization</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. RumiaRent Property Management"
                    className="h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            variant="charcoal"
            size="lg"
            className="h-11 w-full rounded-full"
            isLoading={createOrganization.isPending}
          >
            Continue to Property Setup
          </Button>
        </form>
      </Form>
    </div>
  );
}

function PropertyStep({
  organizationName,
  onAdvance,
  onBack,
}: {
  organizationName: string | null;
  onAdvance: () => void;
  onBack: () => void;
}) {
  const createProperty = useCreateProperty();
  const form = useForm<WizardPropertyFormData>({
    resolver: zodResolver(wizardPropertySchema),
    defaultValues: { name: '', address: '', city: 'Nairobi' },
  });

  const onSubmit = async (values: WizardPropertyFormData) => {
    try {
      // Organization is resolved server-side via the owner fallback in
      // PropertyListCreateView._resolve_organization — never pass
      // organization_id from the client.
      await createProperty.mutateAsync(values);
      onAdvance();
    } catch {
      // Error toast already surfaced by useCreateProperty's onError.
    }
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" aria-label="Go back" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          {organizationName && (
            <p className="text-sm font-medium text-muted-foreground">
              Setting up: {organizationName}
            </p>
          )}
          <h2 className="text-2xl font-semibold text-gray-900">Add your first property</h2>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property name</FormLabel>
                <FormControl>
                  <Input {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            variant="charcoal"
            size="lg"
            className="h-11 w-full rounded-full"
            isLoading={createProperty.isPending}
          >
            Continue to Payout Details
          </Button>
        </form>
      </Form>
    </div>
  );
}

function PayoutStep({ onAdvance, onBack }: { onAdvance: () => void; onBack: () => void }) {
  const { data: payoutStatus } = usePayoutStatus();

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" aria-label="Go back" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-semibold text-gray-900">Payout details</h2>
      </div>
      {payoutStatus && payoutStatus.status !== 'not_started' && (
        <p className="mb-4 text-sm text-muted-foreground">
          Current: {payoutStatus.bank_account_number_masked}
        </p>
      )}
      {/* Advances on any resulting status (pending_verification or active) —
          the wizard never blocks completion on Paystack verification
          (D-04/D-05); PayoutDetailsForm's onSuccess only fires once the
          submission itself succeeds. */}
      <PayoutDetailsForm
        onSuccess={onAdvance}
        submitLabel="Continue to Plan Selection"
        fullWidthButton
      />
    </div>
  );
}

function TierStep({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { data: plans, isLoading, isError, refetch } = usePlans();
  const { data: access } = useBillingAccess();
  const trialDays = access?.on_trial ? access.trial_days_left : 30;
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Records the landlord's tier choice as a preference only (D-06) — this
  // call never creates a Paystack charge; the actual billing flow (Phase 6)
  // is triggered later, from the dashboard.
  const completeMutation = useMutation({
    mutationFn: (plan_slug: string) =>
      axios.post('/accounts/onboarding/wizard-complete/', { plan_slug }),
    onSuccess: () => {
      router.push('/landlord/rental');
    },
    onError: (err) => {
      // CR-03: surface a toast on failure so the landlord isn't left
      // staring at a stopped spinner with no explanation (e.g. the
      // backend's 400s for missing org/property/payout setup, a stale
      // plan slug, or a network error).
      const message = (err as { message?: string })?.message || 'Could not complete setup';
      toast.error(message);
    },
  });

  const handleComplete = () => {
    if (!selectedSlug) return;
    completeMutation.mutate(selectedSlug);
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" aria-label="Go back" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-semibold text-gray-900">Choose your plan</h2>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Your first {trialDays} days are free.</span> You get every
          Enterprise feature from the moment you finish setting up, and you are not charged today. The plan you pick
          here is the one to continue on afterwards.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-64 rounded-3xl" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          title="Couldn't load pricing"
          message="We're having trouble reaching pricing right now. Try again in a moment."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && plans && plans.length === 0 && (
        <EmptyState
          variant="alert"
          title="Pricing unavailable right now"
          description="We couldn't load our current plans. Refresh the page, or contact support if this keeps happening."
        />
      )}

      {!isLoading && !isError && plans && plans.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = selectedSlug === plan.slug;
            const propertiesLabel =
              plan.max_properties === 0
                ? 'Unlimited properties'
                : `${plan.max_properties} propert${plan.max_properties === 1 ? 'y' : 'ies'}`;
            const unitsLabel =
              plan.max_units === 0 ? 'Unlimited units' : `${plan.max_units} units`;
            const seatsLabel =
              plan.max_caretaker_seats === 0
                ? 'Unlimited caretaker seats'
                : `${plan.max_caretaker_seats} caretaker seat${plan.max_caretaker_seats === 1 ? '' : 's'}`;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedSlug(plan.slug)}
                aria-pressed={isSelected}
                className={`rounded-3xl p-8 text-left transition-all ${
                  isSelected
                    ? 'border border-primary bg-white shadow-xl'
                    : 'border border-gray-100 bg-white shadow-sm hover:shadow-md'
                }`}
              >
                <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <PriceDisplay amount={plan.price} size="lg" />
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <li>{propertiesLabel}</li>
                  <li>{unitsLabel}</li>
                  <li>{seatsLabel}</li>
                </ul>
              </button>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant="charcoal"
        size="lg"
        className="mt-8 h-11 w-full rounded-full"
        disabled={!selectedSlug || completeMutation.isPending}
        isLoading={completeMutation.isPending}
        onClick={handleComplete}
      >
        Complete setup
      </Button>
    </div>
  );
}
