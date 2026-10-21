'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Gift, Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

import { axiosInstance as axios } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Steps } from '@/components/ui/steps';
import { useOnboardingStatus } from '@/features/auth/hooks/use-auth';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useCreateOrganization, useCreateProperty } from '@/features/rental/hooks/use-rental';
import { usePaybillAccounts } from '@/features/paybill/hooks';
import { paybillApi } from '@/features/paybill/api';
import { apiErrorMessage } from '@/features/ledger/lib/format';
import { wizardOrgSchema, type WizardOrgFormData } from '@/lib/validations/auth.schema';

// Three short steps, like the Kenyan rent tools landlords already know:
// who you are, what you rent out (units created for you), and the paybill
// tenants already pay into. No bank/payout details and no plan choice:
// rent goes straight to the landlord, and the free trial covers everything.
const WIZARD_STEPS = [{ title: 'Your business' }, { title: 'Your property' }, { title: 'How tenants pay' }];
const DONE = 5; // server's "finished" marker

const UNIT_TYPES = [
  { value: 'bedsitter', label: 'Bedsitters' },
  { value: 'studio', label: 'Studios' },
  { value: '1_bedroom', label: '1 bedroom' },
  { value: '2_bedroom', label: '2 bedroom' },
  { value: '3_bedroom', label: '3 bedroom' },
  { value: 'house', label: 'Houses' },
  { value: 'other', label: 'Mixed / other' },
];

function clampStep(step: number): number {
  return Math.min(3, Math.max(1, step));
}

const card = 'rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10';

export function LandlordOnboardingWizard() {
  const router = useRouter();
  const { data, isLoading } = useOnboardingStatus();
  const [manualStep, setManualStep] = useState<number | null>(null);
  const serverStep = data?.wizard ? clampStep(data.wizard.current_step) : 1;
  const step = manualStep ?? serverStep;
  const finished = data?.wizard?.current_step === DONE;

  useEffect(() => {
    if (finished) router.replace('/landlord/rental');
  }, [finished, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (finished) return null;

  const goTo = (next: number) => setManualStep(clampStep(next));

  return (
    <div className="space-y-8">
      <Steps steps={WIZARD_STEPS} currentStep={step - 1} />
      {manualStep === null && serverStep > 1 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4 text-sm font-semibold text-primary">
          Welcome back. Pick up where you left off.
        </div>
      )}
      {step === 1 && <BusinessStep organizationName={data?.wizard?.organization_name ?? null} onAdvance={() => goTo(2)} />}
      {step === 2 && <PropertyStep onAdvance={() => goTo(3)} onBack={() => goTo(1)} />}
      {step === 3 && (
        <PaymentStep organizationName={data?.wizard?.organization_name ?? ''} onBack={() => goTo(2)} />
      )}
    </div>
  );
}

function BusinessStep({ organizationName, onAdvance }: { organizationName: string | null; onAdvance: () => void }) {
  const createOrganization = useCreateOrganization();
  const form = useForm<WizardOrgFormData>({
    resolver: zodResolver(wizardOrgSchema),
    defaultValues: { name: organizationName ?? '' },
  });

  const onSubmit = async (values: WizardOrgFormData) => {
    if (organizationName && values.name === organizationName) return onAdvance(); // already created
    try {
      await createOrganization.mutateAsync(values);
      onAdvance();
    } catch {
      // useCreateOrganization already shows the error; stay so they can retry.
    }
  };

  return (
    <div className={card}>
      <h2 className="text-2xl font-semibold text-gray-900">What is your business called?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Tenants see this name on receipts and messages.</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business or landlord name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Kamau Properties" className="h-11" autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="h-11 w-full rounded-full" isLoading={createOrganization.isPending}>
            Continue
          </Button>
        </form>
      </Form>
    </div>
  );
}

const propertySchema = z.object({
  name: z.string().trim().min(2, 'Enter the property name').max(255),
  address: z.string().trim().min(3, 'Enter the estate or road').max(500),
  city: z.string().trim().min(2, 'Enter the town').max(100),
  units: z.coerce.number().int('Whole number').min(1, 'At least 1 unit').max(300, 'Up to 300 at a time'),
  prefix: z.string().trim().max(10),
  rent: z.coerce.number().min(0, 'Enter the rent or leave 0'),
  unit_type: z.string(),
});
type PropertyInput = z.input<typeof propertySchema>;
type PropertyOutput = z.output<typeof propertySchema>;

function PropertyStep({ onAdvance, onBack }: { onAdvance: () => void; onBack: () => void }) {
  const qc = useQueryClient();
  const createProperty = useCreateProperty();
  const form = useForm<PropertyInput, unknown, PropertyOutput>({
    resolver: zodResolver(propertySchema),
    defaultValues: { name: '', address: '', city: 'Nairobi', units: 10, prefix: '', rent: 0, unit_type: '1_bedroom' },
  });
  const addUnits = useMutation({
    mutationFn: (payload: { property: string; count: number; prefix: string; monthly_rent: string; unit_type: string }) =>
      axios.post('/units/bulk/', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rental'] }),
  });

  const onSubmit = async (v: PropertyOutput) => {
    let propertyId: string;
    try {
      const property = await createProperty.mutateAsync({ name: v.name, address: v.address, city: v.city });
      propertyId = property.id;
    } catch {
      return; // error toast already shown
    }
    try {
      await addUnits.mutateAsync({
        property: propertyId, count: v.units, prefix: v.prefix, monthly_rent: String(v.rent), unit_type: v.unit_type,
      });
    } catch (err) {
      // The property exists; units can be added from the property page later.
      toast.error(apiErrorMessage(err, 'Property saved, but the units could not be added. Add them from Properties.'));
    }
    onAdvance();
  };

  const prefix = form.watch('prefix');
  const units = Number(form.watch('units')) || 0;

  return (
    <div className={card}>
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" aria-label="Go back" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-semibold text-gray-900">Add your first property</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">You can add more properties and edit units any time.</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Property name</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. Greenview Apartments" className="h-11" autoFocus /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Estate or road</FormLabel>
                <FormControl><Input {...field} placeholder="e.g. Kilimani, Ngong Road" className="h-11" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem>
                <FormLabel>Town</FormLabel>
                <FormControl><Input {...field} className="h-11" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField control={form.control} name="units" render={({ field }) => (
              <FormItem>
                <FormLabel>Number of units</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" min={1} max={300} className="h-11"
                    {...field} value={field.value as number | string} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="unit_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Mostly</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {UNIT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="rent" render={({ field }) => (
              <FormItem>
                <FormLabel>Rent per unit (KES)</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" min={0} className="h-11"
                    {...field} value={field.value as number | string} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="prefix" render={({ field }) => (
            <FormItem>
              <FormLabel>Unit label (optional)</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. A" className="h-11 sm:max-w-40" /></FormControl>
              <FormDescription>
                Your units will be numbered {units > 0 ? `${prefix}1 to ${prefix}${units}` : `${prefix}1, ${prefix}2, ...`}.
                Rent can differ per unit; change it later on the property page.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" size="lg" className="h-11 w-full rounded-full"
            isLoading={createProperty.isPending || addUnits.isPending}>
            Continue
          </Button>
        </form>
      </Form>
    </div>
  );
}

const paybillSchema = z.object({
  shortcode: z.string().trim().regex(/^\d{5,7}$/, 'A paybill number is 5 to 7 digits'),
  display_name: z.string().trim().max(100),
});
type PaybillForm = z.infer<typeof paybillSchema>;

function PaymentStep({ organizationName, onBack }: { organizationName: string; onBack: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: paybills = [] } = usePaybillAccounts();
  const existing = paybills[0];
  const form = useForm<PaybillForm>({
    resolver: zodResolver(paybillSchema),
    defaultValues: { shortcode: '', display_name: organizationName },
  });

  const complete = useMutation({
    mutationFn: () => axios.post('/accounts/onboarding/wizard-complete/', {}),
    onSuccess: () => {
      // The site decides whether to send someone back to /onboarding from a
      // cookie set at sign-in; refresh it or the next page load bounces back.
      useAuthStore.getState().updateUser({ onboarding_stage: 'COMPLETED' });
      router.push('/landlord/rental');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not finish setup')),
  });
  const connect = useMutation({
    mutationFn: (v: PaybillForm) =>
      paybillApi.connect({
        shortcode: v.shortcode, shortcode_type: 'paybill', display_name: v.display_name, environment: 'production',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['paybill'] }),
  });

  const onSubmit = async (v: PaybillForm) => {
    try {
      await connect.mutateAsync(v);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the paybill'));
      return;
    }
    complete.mutate();
  };

  return (
    <div className={card}>
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" aria-label="Go back" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-semibold text-gray-900">How do tenants pay you?</h2>
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-gray-700">
        <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p>
          Rent keeps going <span className="font-semibold text-gray-900">straight to your own M-Pesa paybill</span>.
          RumiaRent never touches the money. Each tenant gets their own account number to type, so we can tell who
          paid and send their receipt.
        </p>
      </div>

      {existing ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm">
            Paybill <span className="font-mono font-semibold">{existing.shortcode}</span> is saved.
          </p>
          <Button size="lg" className="h-11 w-full rounded-full" isLoading={complete.isPending} onClick={() => complete.mutate()}>
            Go to my dashboard
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField control={form.control} name="shortcode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Paybill (business) number</FormLabel>
                  <FormControl><Input {...field} inputMode="numeric" placeholder="e.g. 522522" className="h-11" autoFocus /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="display_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name tenants see on M-Pesa</FormLabel>
                  <FormControl><Input {...field} className="h-11" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <Button type="submit" size="lg" className="h-11 w-full rounded-full"
              isLoading={connect.isPending || complete.isPending}>
              Finish setup
            </Button>
          </form>
        </Form>
      )}

      <div className="mt-6 border-t border-gray-100 pt-5 text-center">
        <p className="mb-2 text-sm text-gray-600">
          No paybill yet, or you collect cash or bank transfers? Skip this. You can record payments yourself and add a
          paybill later under M-Pesa paybill.
        </p>
        <Button type="button" variant="ghost" onClick={() => complete.mutate()} disabled={complete.isPending}>
          Skip for now
        </Button>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Gift className="h-4 w-4 text-primary" aria-hidden />
        Free for 30 days with every feature. Choose a plan later from Billing.
      </p>
    </div>
  );
}
