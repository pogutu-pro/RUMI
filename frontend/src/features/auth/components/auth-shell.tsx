import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';

const POINTS = [
  'Tenants pay your own paybill. We never touch the rent.',
  'Every M-Pesa payment matched and receipted for you.',
  'Free for 30 days. No card needed.',
];

/**
 * The frame every sign-in and setup screen sits in: a narrow form column on
 * the left and, from laptop width up, a brand panel showing the product on
 * the right. Phones get just the form, so nothing pushes it below the fold.
 */
export function AuthShell({ children, topRight }: { children: ReactNode; topRight?: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-white">
      <div className="flex min-h-dvh flex-1 flex-col px-5 sm:px-10">
        <header className="flex h-16 shrink-0 items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="RumiaRent home">
            <Image src="/images/logo/logo.png" alt="" width={28} height={28} className="h-7 w-7" priority />
            <span className="text-lg font-semibold tracking-tight text-gray-900">
              Rumia<span className="text-primary">Rent</span>
            </span>
          </Link>
          {topRight}
        </header>
        <main className="flex flex-1 items-start justify-center pb-8 pt-6 sm:items-center sm:py-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>
        <footer className="shrink-0 pb-6 text-center text-xs leading-relaxed text-gray-500">
          By continuing you agree to the{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-gray-700">Terms</Link> and{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-gray-700">Privacy Policy</Link>.
        </footer>
      </div>

      <aside className="hidden p-3 lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-[46%] xl:w-1/2" aria-hidden="true">
        <div className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-[#033d2a] px-12 pt-14 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'linear-gradient(to bottom, black, transparent 75%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 75%)',
            }}
          />
          <div className="relative max-w-md">
            <p className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
              Know who has paid rent, without checking M-Pesa messages.
            </p>
            <ul className="mt-8 space-y-3">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[15px] text-emerald-50/85">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Check className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mt-auto flex justify-center pt-12">
            <figure className="w-[260px] translate-y-10 overflow-hidden rounded-[2rem] border-[7px] border-gray-950 bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
              <Image
                src="/images/product/dashboard-mobile-v2.webp"
                alt=""
                width={585}
                height={1266}
                sizes="260px"
                className="h-auto w-full"
              />
            </figure>
            <div className="absolute bottom-24 left-6 w-56 rounded-xl bg-white p-3 text-gray-900 shadow-xl xl:left-12">
              <p className="text-xs font-medium text-gray-500">M-Pesa · just now</p>
              <p className="mt-1 text-sm font-semibold">KES 18,000 from Lucy Atieno</p>
              <p className="mt-0.5 text-xs text-emerald-700">Matched to R3 · receipt sent</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
