'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  DoorOpen,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/dashboard/page-header';
import { cn } from '@/lib/utils/cn';
import { useTenancies, useRentBalance, usePayments } from '@/features/rental/hooks/use-rental';
import type { Payment, RentCharge, Tenancy } from '@/features/rental/types';
import { useInvoices } from '@/features/ledger/hooks/use-ledger';
import { InvoiceDetailSheet } from '@/features/ledger/components/invoice-detail-sheet';
import { InvoiceStatusBadge } from '@/features/ledger/components/invoice-status-badge';
import { ReceiptDownloadButton } from '@/features/ledger/components/receipt-actions';
import { INVOICE_TYPE_LABEL } from '@/features/ledger/lib/format';
import { usePaybillInstructions } from '@/features/paybill/hooks';
import { DocumentList, NoticeDialog } from '@/features/leasing/components';

const PAY_HREF = '/tenant/rental/pay';
const HISTORY_PAGE_SIZE = 5;

function formatKes(amount: string | number) {
  const n = Number(amount);
  return `KES ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

function formatDate(value: string | null | undefined, fallback = '—') {
  if (!value) return fallback;
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? fallback : format(date, 'd MMM yyyy');
}

function ordinal(n: number) {
  const rem = n % 100;
  if (rem >= 11 && rem <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

/** The next calendar date the rent falls due, clamped for short months. */
function nextDueDate(dueDay: number, from = new Date()) {
  const build = (year: number, month: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(dueDay, lastDay));
  };
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const thisMonth = build(from.getFullYear(), from.getMonth());
  return thisMonth >= today ? thisMonth : build(from.getFullYear(), from.getMonth() + 1);
}

type Tone = 'ok' | 'due' | 'overdue';

const TONE_STYLES: Record<Tone, { card: string; pill: string; muted: string }> = {
  ok: {
    card: 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white',
    pill: 'bg-white/15 text-white',
    muted: 'text-white/75',
  },
  due: {
    card: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
    pill: 'bg-white/20 text-white',
    muted: 'text-white/80',
  },
  overdue: {
    card: 'bg-gradient-to-br from-red-600 to-rose-700 text-white',
    pill: 'bg-white/20 text-white',
    muted: 'text-white/80',
  },
};

function RentHero({
  tenancy,
  nextCharge,
  outstanding,
}: {
  tenancy: Tenancy;
  nextCharge: RentCharge | undefined;
  outstanding: number;
}) {
  const owing = outstanding > 0 && !!nextCharge;
  const tone: Tone = !owing ? 'ok' : nextCharge?.status === 'overdue' ? 'overdue' : 'due';
  const styles = TONE_STYLES[tone];
  const upcoming = nextDueDate(tenancy.rent_due_day);

  const PillIcon = tone === 'ok' ? CheckCircle2 : AlertCircle;
  const pillText = tone === 'ok' ? 'Rent is up to date' : tone === 'overdue' ? 'Rent overdue' : 'Rent due';

  return (
    <section className={cn('relative overflow-hidden rounded-3xl p-6 shadow-lg sm:p-8', styles.card)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-black/10 blur-2xl"
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-4">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
              styles.pill,
            )}
          >
            <PillIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {pillText}
          </span>

          <div>
            <p className={cn('text-sm', styles.muted)}>{owing ? 'Outstanding balance' : 'Monthly rent'}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
              {formatKes(owing ? outstanding : tenancy.monthly_rent)}
            </p>
          </div>

          <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-sm', styles.muted)}>
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              {tenancy.property_name}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
              Unit {tenancy.unit_number}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              {owing && nextCharge
                ? `Due ${formatDate(nextCharge.due_date)}`
                : `Next rent due ${format(upcoming, 'd MMM yyyy')}`}
            </span>
          </p>
        </div>

        <Link
          href={PAY_HREF}
          className={cn(
            buttonVariants({ size: 'lg' }),
            'h-12 shrink-0 gap-2 rounded-xl bg-white px-6 text-base font-semibold text-gray-900 shadow-md hover:bg-white/90',
          )}
        >
          {owing ? 'Pay now' : 'Pay in advance'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  success: { label: 'Paid', className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-400' },
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-400' },
  processing: { label: 'Processing', className: 'bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-400' },
  failed: { label: 'Not completed', className: 'bg-red-500/10 text-red-700 ring-red-600/20 dark:text-red-400' },
  reversed: { label: 'Reversed', className: 'bg-muted text-muted-foreground ring-border' },
};

function PaymentStatusPill({ status }: { status: string }) {
  const meta = PAYMENT_STATUS[status] ?? { label: status, className: 'bg-muted text-muted-foreground ring-border' };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

function PaymentHistory({ payments, isLoading }: { payments: Payment[]; isLoading: boolean }) {
  const [page, setPage] = React.useState(1);
  const pageCount = Math.max(1, Math.ceil(payments.length / HISTORY_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const shown = payments.slice(start, start + HISTORY_PAGE_SIZE);

  return (
    <section className="rounded-2xl border bg-background shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Payment history</h2>
          <p className="text-xs text-muted-foreground">Every payment you have made or attempted</p>
        </div>
        {payments.length > 0 && <Badge variant="secondary">{payments.length}</Badge>}
      </div>

      {isLoading ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading payments…</p>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Receipt className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">No payments yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Once you pay rent, it will show up here with a full receipt trail.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y">
            {shown.map((payment) => {
              const succeeded = payment.status === 'success';
              const when = payment.paid_at ?? payment.created_at;
              return (
                <li key={payment.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      succeeded ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {succeeded ? <CheckCircle2 className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">Rent payment</p>
                    <p className="text-xs text-muted-foreground">{formatDate(when)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-sm font-semibold text-foreground">{formatKes(payment.amount)}</p>
                    <PaymentStatusPill status={payment.status} />
                  </div>
                  {payment.receipt && <ReceiptDownloadButton receipt={payment.receipt} />}
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {start + 1}–{start + shown.length} of {payments.length}
            </p>
            <div className="flex items-center gap-1">
              <span className="mr-2 text-xs text-muted-foreground">
                Page {currentPage} of {pageCount}
              </span>
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default function TenantRentalDashboard() {
  const {
    data: tenancies = [],
    isLoading: tenanciesLoading,
    isError: tenanciesError,
  } = useTenancies();
  const {
    data: balance,
    isLoading: balanceLoading,
    isError: balanceError,
    refetch: refetchBalance,
  } = useRentBalance();
  const { data: payments = [], isLoading: paymentsLoading } = usePayments();
  const { data: invoices = [] } = useInvoices();
  const { data: paybills = [] } = usePaybillInstructions();
  const [openInvoice, setOpenInvoice] = React.useState<string | null>(null);
  const [noticeOpen, setNoticeOpen] = React.useState(false);

  const activeTenancy = tenancies.find((t) => t.status === 'active') ?? tenancies[0];
  const nextCharge = (balance?.charges ?? [])
    .filter((c) => c.status !== 'paid' && c.status !== 'waived')
    .slice()
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  if (tenanciesError || balanceError) {
    return <ErrorState onRetry={() => refetchBalance()} />;
  }

  if (tenanciesLoading || balanceLoading) {
    return <LoadingSkeleton type="card" />;
  }

  if (!activeTenancy) {
    return <p className="text-sm text-muted-foreground">No tenancy on file yet — contact your landlord.</p>;
  }

  const outstanding = Number(balance?.outstanding_total ?? '0');

  return (
    <div className="space-y-6">
      <PageHeader title="My rent" description="Your home, your rent and your payments in one place." />

      <RentHero tenancy={activeTenancy} nextCharge={nextCharge} outstanding={outstanding} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Wallet} label="Monthly rent" value={formatKes(activeTenancy.monthly_rent)} />
        <StatTile icon={ShieldCheck} label="Deposit" value={formatKes(activeTenancy.deposit)} />
        <StatTile
          icon={CalendarClock}
          label="Rent due"
          value={`${ordinal(activeTenancy.rent_due_day)} of month`}
        />
        <StatTile
          icon={CalendarDays}
          label="Lease ends"
          value={activeTenancy.end_date ? formatDate(activeTenancy.end_date) : 'Ongoing'}
        />
      </div>

      {paybills.filter((p) => p.tenancy === activeTenancy.id).map((p) => (
        <section key={`${p.tenancy}-${p.shortcode}`} className="rounded-2xl border bg-background p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Pay by M-Pesa</h2>
          <p className="text-xs text-muted-foreground">Paid this way, your payment is recorded and receipted automatically.</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <dt className="text-xs text-muted-foreground">{p.shortcode_type === 'till' ? 'Till number' : 'Paybill number'}</dt>
              <dd className="font-mono text-lg font-semibold">{p.shortcode}</dd>
            </div>
            {p.account_number && (
              <div className="rounded-xl bg-muted/50 p-3">
                <dt className="text-xs text-muted-foreground">Account number</dt>
                <dd className="font-mono text-lg font-semibold">{p.account_number}</dd>
              </div>
            )}
            <div className="col-span-2 rounded-xl bg-muted/50 p-3 sm:col-span-1">
              <dt className="text-xs text-muted-foreground">Business</dt>
              <dd className="text-sm font-medium">{p.business_name}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            M-Pesa → Lipa na M-Pesa → {p.shortcode_type === 'till' ? 'Buy Goods and Services' : 'Pay Bill'}. Use exactly this
            account number.
          </p>
        </section>
      ))}

      {invoices.length > 0 && (
        <section className="rounded-2xl border bg-background shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Invoices</h2>
            <p className="text-xs text-muted-foreground">Rent and other charges. Tap one to see what it covers.</p>
          </div>
          <ul className="divide-y">
            {invoices.slice(0, 12).map((invoice) => (
              <li key={invoice.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-muted/50"
                  onClick={() => setOpenInvoice(invoice.id)}
                >
                  <span className="min-w-0 text-sm">
                    <span className="font-medium">{INVOICE_TYPE_LABEL[invoice.invoice_type]}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[invoice.number, `due ${formatDate(invoice.due_date)}`].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm tabular-nums">
                    {formatKes(Number(invoice.outstanding) > 0 ? invoice.outstanding : invoice.amount_due)}
                    <InvoiceStatusBadge status={invoice.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <InvoiceDetailSheet invoiceId={openInvoice} onClose={() => setOpenInvoice(null)} audience="tenant" />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border bg-background shadow-sm lg:col-span-2">
          <div className="border-b px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Lease details</h2>
            <p className="text-xs text-muted-foreground">The terms of your tenancy</p>
          </div>
          <dl className="divide-y px-5">
            <DetailRow label="Property">{activeTenancy.property_name}</DetailRow>
            <DetailRow label="Unit">{activeTenancy.unit_number}</DetailRow>
            <DetailRow label="Status">
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:text-emerald-400">
                {activeTenancy.status.replace('_', ' ')}
              </span>
            </DetailRow>
            <DetailRow label="Lease starts">{formatDate(activeTenancy.start_date)}</DetailRow>
            <DetailRow label="Lease ends">
              {activeTenancy.end_date ? formatDate(activeTenancy.end_date) : 'Ongoing'}
            </DetailRow>
          </dl>
          <div className="space-y-3 border-t px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">My documents</h3>
            <DocumentList tenancyId={activeTenancy.id} />
            {activeTenancy.status === 'active' && (
              <Button variant="outline" size="sm" onClick={() => setNoticeOpen(true)}>Give notice to vacate</Button>
            )}
            {activeTenancy.status === 'notice_period' && activeTenancy.end_date && (
              <p className="text-sm text-muted-foreground">You are on notice, moving out {formatDate(activeTenancy.end_date)}.</p>
            )}
          </div>
        </section>
        <NoticeDialog tenancyId={activeTenancy.id} open={noticeOpen} onOpenChange={setNoticeOpen} byTenant />

        <div className="lg:col-span-3">
          <PaymentHistory payments={payments} isLoading={paymentsLoading} />
        </div>
      </div>
    </div>
  );
}
