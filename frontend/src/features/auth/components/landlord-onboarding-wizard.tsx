'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';

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
import { useOnboardingStatus } from '@/features/auth/hooks/use-auth';
import { useCreateOrganization, useCreateProperty } from '@/features/rental/hooks/use-rental';
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
 * `wizard` block, Phase 4 Plan 01), not a client-local draft replay.
 *
 * Task 1 (tracer): wizard shell + org step + property step, end-to-end.
 * Payout (Task 2) and tier-selection (Task 3) steps land as placeholders
 * here and are replaced with their real implementations in later tasks.
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
      {step === 3 && (
        <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
          <p className="text-sm text-muted-foreground">Payout setup — coming next.</p>
        </div>
      )}
      {step === 4 && (
        <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
          <p className="text-sm text-muted-foreground">Plan selection — coming next.</p>
        </div>
      )}
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
                <FormLabel className="font-semibold">Organization name</FormLabel>
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
            className="h-14 w-full rounded-full"
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
                <FormLabel className="font-semibold">Property name</FormLabel>
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
                <FormLabel className="font-semibold">Address</FormLabel>
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
                <FormLabel className="font-semibold">City</FormLabel>
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
            className="h-14 w-full rounded-full"
            isLoading={createProperty.isPending}
          >
            Continue to Payout Details
          </Button>
        </form>
      </Form>
    </div>
  );
}
