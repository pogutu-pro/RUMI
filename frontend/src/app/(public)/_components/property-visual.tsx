'use client';

/**
 * Animated hero visualization of the RumiaRent product — NOT a live
 * dashboard and never labeled as one. It is a stylized product illustration
 * (properties, rent collected, activity feed) with example figures, the
 * same way most SaaS hero sections show an illustrative product screenshot.
 * Real account data does not appear in the public marketing site.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Building2, WalletCards, Bell, CheckCircle2, ArrowUpRight } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PROPERTIES = [
  { name: 'Westlands Apartments', units: '24 Units' },
  { name: 'Kilimani Residences', units: '18 Units' },
  { name: 'Roysambu Flats', units: '12 Units' },
];

const ACTIVITY = [
  'Rent payment received',
  'New tenant added',
  'Rent notice sent',
  'Maintenance request updated',
];

/** Lightweight count-up, mirrors the easing already used by AnimatedCounter
 * (components/animations/animated-counter.tsx) but inline, so the number
 * sits directly beside "KES" inside this card's own layout. */
function useCountUp(target: number, start: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return value;
}

export function PropertyManagementVisual() {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [dashboardIn, setDashboardIn] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDashboardIn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const rentCollected = useCountUp(486000, dashboardIn && !prefersReducedMotion);

  // With reduced motion, skip the stage-by-stage reveal and ambient loops —
  // just show the finished card, instantly, no transforms.
  const reduce = !!prefersReducedMotion;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[520px] lg:mx-0">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 50, scale: 0.94 }}
        animate={dashboardIn ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{ duration: 0.9, delay: reduce ? 0 : 0.15, ease: EASE }}
        className="relative rounded-3xl border border-black/[0.08] bg-white p-6 shadow-[0_30px_80px_-30px_rgba(17,17,17,0.18)] sm:p-8"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-wider text-gray-900">My Properties</p>
          <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>

        {/* Stage 2 — property cards */}
        <div className="mb-6 space-y-3">
          {PROPERTIES.map((property, i) => (
            <motion.div
              key={property.name}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={dashboardIn ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.5, delay: reduce ? 0 : 0.5 + i * 0.12, ease: EASE }}
              className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span className="text-sm font-semibold text-gray-900">{property.name}</span>
              </div>
              <span className="text-xs font-medium text-gray-500">{property.units}</span>
            </motion.div>
          ))}
        </div>

        {/* Stage 3 — rent collection */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={dashboardIn ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: reduce ? 0 : 0.95, ease: EASE }}
          className="mb-6 flex items-center justify-between rounded-2xl bg-primary/[0.06] p-5"
        >
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Rent Collected
            </p>
            <p className="text-2xl font-bold text-gray-900">
              KES {rentCollected.toLocaleString('en-US')}
            </p>
          </div>
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            <svg viewBox="0 0 36 36" className="absolute h-14 w-14 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary/15" />
              <motion.circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-primary"
                strokeDasharray={2 * Math.PI * 15.5}
                initial={reduce ? false : { strokeDashoffset: 2 * Math.PI * 15.5 }}
                animate={dashboardIn ? { strokeDashoffset: 2 * Math.PI * 15.5 * 0.22 } : undefined}
                transition={{ duration: 1.4, delay: reduce ? 0 : 0.95, ease: EASE }}
              />
            </svg>
            <WalletCards className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
        </motion.div>

        {/* Stage 4 — activity */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Recent Activity
          </p>
          <div className="space-y-2.5">
            {ACTIVITY.map((item, i) => (
              <motion.div
                key={item}
                initial={reduce ? false : { opacity: 0, x: -12 }}
                animate={dashboardIn ? { opacity: 1, x: 0 } : undefined}
                transition={{ duration: 0.4, delay: reduce ? 0 : 1.3 + i * 0.1, ease: EASE }}
                className="flex items-center gap-2.5"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-sm text-gray-600">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stage 5 — floating notification */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.8, y: 20 }}
        animate={
          dashboardIn
            ? reduce
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 1, scale: 1, y: [20, 0, -6, 0] }
            : undefined
        }
        transition={
          reduce
            ? { duration: 0.4 }
            : {
                opacity: { duration: 0.5, delay: 1.8, ease: EASE },
                scale: { duration: 0.5, delay: 1.8, ease: EASE },
                y: {
                  duration: 3.2,
                  delay: 1.8,
                  times: [0, 0.25, 0.65, 1],
                  repeat: Infinity,
                  repeatDelay: 1.4,
                  ease: 'easeInOut',
                },
              }
        }
        className="absolute -left-6 -bottom-6 flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 shadow-[0_20px_50px_-20px_rgba(17,17,17,0.25)] sm:-left-10"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <ArrowUpRight className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">Rent Payment Received</p>
          <p className="text-xs text-gray-500">KES 24,000</p>
        </div>
      </motion.div>

      {/* Small ambient pulse on the header indicator — barely noticeable */}
      {!reduce && (
        <motion.div
          className="absolute right-8 top-8 h-2 w-2 rounded-full bg-primary sm:right-10"
          animate={dashboardIn ? { opacity: [0.4, 1, 0.4] } : undefined}
          transition={{ duration: 2.6, delay: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}
