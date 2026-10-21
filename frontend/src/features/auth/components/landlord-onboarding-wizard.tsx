'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Gift, Loader2, Smartphone } from 'lucide-react';
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
import { authApi } from '@/features/auth/api/auth';
import { useAuth, useOnboardingStatus } from '@/features/auth/hooks/use-auth';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useCreateOrganization, useCreateProperty } from '@/features/rental/hooks/use-rental';
import { usePaybillAccounts } from '@/features/paybill/hooks';
import { paybillApi } from '@/features/paybill/api';
import { apiErrorMessage } from '@/features/ledger/lib/format';
import { WhatsAppHelp } from '@/components/support/whatsapp-help';
import { cn } from '@/lib/utils/cn';

// Three short steps, like the Kenyan rent tools landlords already know:
// who you are, what you rent out (units created for you), and the paybill
// tenants already pay into. No bank/payout details and no plan choice:
// rent goes straight to the landlord, and the free trial covers everything.
const STEPS = [
  { title: 'About you', hint: 'Your name and business' },
  { title: 'Your property', hint: 'Units are created for you' },
  { title: 'How tenants pay', hint: 'Your M-Pesa paybill' },
];
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

const field = 'h-11 text-base';

function clampStep(step: number): number {
  return Math.min(3, Math.max(1, step));
}

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

  if (isLoading || finished) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  const goTo = (next: number) => setManualStep(clampStep(next));

  return (
    <OnboardingFrame step={step} resumed={manualStep === null && serverStep > 1}>
      {step === 1 && <AboutStep organizationName={data?.wizard?.organization_name ?? null} onAdvance={() => goTo(2)} />}
      {step === 2 && <PropertyStep onAdvance={() => goTo(3)} onBack={() => goTo(1)} />}
      {step === 3 && <PaymentStep organizationName={data?.wizard?.organization_name ?? ''} onBack={() => goTo(2)} />}
    </OnboardingFrame>
  );
}

/** Step rail on the left from laptop width; a slim progress bar on phones. */
function OnboardingFrame({ step, resumed, children }: { step: number; resumed: boolean; children: ReactNode }) {
  const { logout } = useAuth();
  const logo = (
    <Link href="/" className="inline-flex items-center gap-2" aria-label="RumiaRent home">
      <Image src="/images/logo/logo.png" alt="" width={28} height={28} className="h-7 w-7" priority />
      <span className="text-lg font-semibold tracking-tight text-gray-900">
        Rumia<span className="text-primary">Rent</span>
      </span>
    </Link>
  );

  return (
    <div className="flex min-h-dvh bg-white">
      <aside className="hidden w-[300px] shrink-0 flex-col border-r border-gray-100 bg-gray-50/70 px-8 py-6 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        {logo}
        <div className="mt-12">
          <p className="text-sm font-semibold text-gray-900">Set up RumiaRent</p>
          <p className="mt-0.5 text-sm text-gray-500">About two minutes. Change anything later.</p>
        </div>
        <ol className="mt-8 space-y-1">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = n < step;
            const current = n === step;
            return (
              <li
                key={s.title}
                aria-current={current ? 'step' : undefined}
                className={cn('flex items-start gap-3 rounded-xl px-3 py-3', current && 'bg-white shadow-sm ring-1 ring-gray-100')}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    done && 'bg-primary text-white',
                    current && 'bg-gray-900 text-white',
                    !done && !current && 'border border-gray-300 text-gray-500',
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" aria-label="Done" /> : n}
                </span>
                <span>
                  <span className={cn('block text-sm font-medium', current || done ? 'text-gray-900' : 'text-gray-500')}>
                    {s.title}
                  </span>
                  <span className="block text-xs text-gray-500">{s.hint}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <div className="mt-auto space-y-4">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
            <Gift className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            Free for 30 days with every feature. Choose a plan later from Billing.
          </p>
          <button type="button" onClick={() => void logout()} className="text-xs font-medium text-gray-500 hover:text-gray-900">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between px-5 lg:hidden">
          {logo}
          <span className="text-sm text-gray-500">
            Step {step} of {STEPS.length}
          </span>
        </header>
        <div className="h-1 bg-gray-100 lg:hidden" aria-hidden>
          <div className="h-full bg-primary transition-all" style={{ width: `${(step / STEPS.length) * 100}%` }} />
        </div>
        <main className="flex flex-1 justify-center px-5 py-8 sm:px-10 sm:py-16">
          <div className="w-full max-w-xl">
            {resumed && (
              <p className="mb-6 rounded-lg bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
                Welcome back. Pick up where you left off.
              </p>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function StepHeading({ step, title, subtitle, onBack }: { step: number; title: string; subtitle: string; onBack?: () => void }) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="-ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <span className="hidden lg:inline">
          Step {step} of {STEPS.length}
        </span>
      </div>
      <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">{title}</h1>
      <p className="mt-1.5 text-[15px] text-gray-500">{subtitle}</p>
    </div>
  );
}

/** Kenyan mobile numbers as +2547XXXXXXXX / +2541XXXXXXXX, or null if not one. */
export function normalizeKenyanPhone(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, '');
  const match = digits.match(/^(?:\+?254|0)?([17]\d{8})$/);
  return match ? `+254${match[1]}` : null;
}

function aboutSchema(askName: boolean) {
  return z.object({
    full_name: askName
      ? z.string().trim().min(2, 'Enter your name').max(150)
      : z.string().trim().max(150),
    phone: z
      .string()
      .trim()
      .refine((v) => v === '' || normalizeKenyanPhone(v) !== null, 'Enter a Kenyan number like 0712 345 678'),
    name: z.string().trim().min(2, 'Enter your business or landlord name').max(255),
  });
}
type AboutForm = z.infer<ReturnType<typeof aboutSchema>>;

function AboutStep({ organizationName, onAdvance }: { organizationName: string | null; onAdvance: () => void }) {
  const user = useAuthStore((s) => s.user);
  const createOrganization = useCreateOrganization();
  // People who signed up with an email link or Google may have no name or
  // phone yet; only ask for what is missing.
  const askName = !user?.first_name?.trim();
  const askPhone = !user?.phone_number?.trim();
  const [saving, setSaving] = useState(false);
  const form = useForm<AboutForm>({
    resolver: zodResolver(aboutSchema(askName)),
    defaultValues: { full_name: '', phone: '', name: organizationName ?? '' },
  });

  const onSubmit = async (values: AboutForm) => {
    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      if (askName) {
        const [first, ...rest] = values.full_name.trim().split(/\s+/);
        updates.first_name = first;
        updates.last_name = rest.join(' ');
      }
      const phone = values.phone ? normalizeKenyanPhone(values.phone) : null;
      if (askPhone && phone) updates.phone_number = phone;
      if (Object.keys(updates).length) {
        try {
          await authApi.updateProfile(updates as never);
          useAuthStore.getState().updateUser(updates);
        } catch (err) {
          toast.error(apiErrorMessage(err, 'Could not save your name. Try again.'));
          return;
        }
      }
      if (organizationName && values.name === organizationName) return onAdvance(); // already created
      try {
        await createOrganization.mutateAsync({ name: values.name });
        onAdvance();
      } catch {
        // useCreateOrganization already shows the error; stay so they can retry.
      }
    } finally {
      setSaving(false);
    }
  };

  const firstName = user?.first_name?.trim();

  return (
    <>
      <StepHeading
        step={1}
        title={firstName ? `Welcome, ${firstName}` : 'Welcome to RumiaRent'}
        subtitle="Tell us who tenants are paying. They see this name on receipts and messages."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {askName && (
            <FormField control={form.control} name="full_name" render={({ field: f }) => (
              <FormItem>
                <FormLabel>Your name</FormLabel>
                <FormControl><Input {...f} autoComplete="name" placeholder="e.g. Grace Mwangi" className={field} autoFocus /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
          {askPhone && (
            <FormField control={form.control} name="phone" render={({ field: f }) => (
              <FormItem>
                <FormLabel>Phone number <span className="font-normal text-gray-400">(optional)</span></FormLabel>
                <FormControl>
                  <Input {...f} type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" className={field} />
                </FormControl>
                <FormDescription>For important alerts by SMS. Never shown to tenants.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          )}
          <FormField control={form.control} name="name" render={({ field: f }) => (
            <FormItem>
              <FormLabel>Business or landlord name</FormLabel>
              <FormControl>
                <Input {...f} placeholder="e.g. Kamau Properties" className={field} autoFocus={!askName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="h-11 w-full text-base" isLoading={saving}>
            Continue
          </Button>
        </form>
      </Form>
    </>
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
    <>
      <StepHeading
        step={2}
        title="Add your first property"
        subtitle="We create the units for you. Add more properties any time."
        onBack={onBack}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="name" render={({ field: f }) => (
            <FormItem>
              <FormLabel>Property name</FormLabel>
              <FormControl><Input {...f} placeholder="e.g. Greenview Apartments" className={field} autoFocus /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField control={form.control} name="address" render={({ field: f }) => (
              <FormItem>
                <FormLabel>Estate or road</FormLabel>
                <FormControl><Input {...f} placeholder="e.g. Kilimani, Ngong Road" className={field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="city" render={({ field: f }) => (
              <FormItem>
                <FormLabel>Town</FormLabel>
                <FormControl><Input {...f} className={field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <FormField control={form.control} name="units" render={({ field: f }) => (
              <FormItem>
                <FormLabel>Units</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" min={1} max={300} className={field}
                    {...f} value={f.value as number | string} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="rent" render={({ field: f }) => (
              <FormItem>
                <FormLabel>Rent each (KES)</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" min={0} className={field}
                    {...f} value={f.value as number | string} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="unit_type" render={({ field: f }) => (
              <FormItem className="col-span-2 sm:col-span-1">
                <FormLabel>Mostly</FormLabel>
                <Select value={f.value} onValueChange={f.onChange}>
                  <FormControl><SelectTrigger className={field}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {UNIT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="prefix" render={({ field: f }) => (
            <FormItem>
              <FormLabel>Unit label <span className="font-normal text-gray-400">(optional)</span></FormLabel>
              <FormControl><Input {...f} placeholder="e.g. A" className={cn(field, 'sm:max-w-40')} /></FormControl>
              <FormDescription>
                Units will be numbered {units > 0 ? `${prefix}1 to ${prefix}${units}` : `${prefix}1, ${prefix}2, ...`}.
                Rent can differ per unit; change it later on the property page.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="h-11 w-full text-base" isLoading={createProperty.isPending || addUnits.isPending}>
            Continue
          </Button>
        </form>
      </Form>
    </>
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
    <>
      <StepHeading
        step={3}
        title="How do tenants pay you?"
        subtitle="Add the paybill tenants already use, and we match every payment to the right tenant."
        onBack={onBack}
      />
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-gray-700">
        <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p>
          Rent keeps going <span className="font-semibold text-gray-900">straight to your own paybill</span>. RumiaRent
          never touches the money. Each tenant gets an account number to type, so we know who paid and send the receipt.
        </p>
      </div>

      {existing ? (
        <div className="space-y-4">
          <p className="text-sm">
            Paybill <span className="font-mono font-semibold">{existing.shortcode}</span> is saved.
          </p>
          <Button className="h-11 w-full text-base" isLoading={complete.isPending} onClick={() => complete.mutate()}>
            Go to my dashboard
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField control={form.control} name="shortcode" render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Paybill number</FormLabel>
                  <FormControl><Input {...f} inputMode="numeric" placeholder="e.g. 522522" className={field} autoFocus /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="display_name" render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Name tenants see on M-Pesa</FormLabel>
                  <FormControl><Input {...f} className={field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <Button type="submit" className="h-11 w-full text-base" isLoading={connect.isPending || complete.isPending}>
              Finish setup
            </Button>
          </form>
        </Form>
      )}

      <div className="mt-8 border-t border-gray-100 pt-6">
        <Button type="button" variant="outline" className="h-11 w-full" onClick={() => complete.mutate()} disabled={complete.isPending}>
          Skip for now
        </Button>
        <p className="mt-3 text-center text-xs leading-relaxed text-gray-500">
          No paybill yet, or you take cash or bank transfers? Skip this and record payments yourself. Add a paybill
          later under M-Pesa.
        </p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-1 rounded-xl bg-gray-50 px-4 py-4 text-center">
        <p className="text-sm text-gray-600">Rather we set it up with you? It takes a few minutes.</p>
        <WhatsAppHelp topic="paybill" business={organizationName} />
      </div>
    </>
  );
}
