'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { PropertyManagementVisual } from './property-visual';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Deliberately restrained — this is a hint of depth on scroll-out, not a
  // parallax showpiece.
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const visualScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section ref={sectionRef} className="relative w-full min-h-screen overflow-hidden bg-background">
      {/* Extremely subtle architectural geometry — floor-plan-adjacent lines
          and shapes, never decorative enough to distract. */}
      <motion.div
        aria-hidden="true"
        style={prefersReducedMotion ? undefined : { y: bgY }}
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <svg className="absolute right-[-5%] top-[8%] h-[420px] w-[420px] text-primary opacity-[0.05]" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="99" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="absolute left-[4%] bottom-[6%] h-64 w-64 text-black opacity-[0.04]" viewBox="0 0 200 200" fill="none">
          <rect x="10" y="10" width="180" height="180" stroke="currentColor" strokeWidth="1" />
          <line x1="10" y1="90" x2="190" y2="90" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="10" x2="100" y2="90" stroke="currentColor" strokeWidth="1" />
        </svg>
      </motion.div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1280px] flex-col justify-center gap-16 px-5 pt-28 pb-16 sm:px-8 lg:flex-row lg:items-center lg:gap-12 lg:pt-24">
        {/* Text content */}
        <motion.div
          style={prefersReducedMotion ? undefined : { opacity: contentOpacity, y: contentY }}
          className="mx-auto w-full max-w-[600px] text-center lg:mx-0 lg:text-left"
        >
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Badge
              variant="outline"
              className="mb-8 inline-flex rounded-full border-primary/20 bg-primary/5 px-4 py-1.5 font-semibold tracking-wide text-primary"
            >
              Built for Kenyan landlords and agents
            </Badge>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.12 }}
            className="mb-6 font-bold text-gray-900"
            style={{ fontSize: 'clamp(2.7rem, 6vw, 5.5rem)', lineHeight: 0.98, letterSpacing: '-0.04em' }}
          >
            Manage Your Properties.
            <br />
            Run Your Rentals <span className="text-primary">Smarter</span>.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.24 }}
            className="mx-auto mb-10 max-w-[560px] text-gray-500 lg:mx-0"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', lineHeight: 1.65 }}
          >
            RumiaRent gives landlords one simple place to manage properties, tenants, rent,
            income, notices, and everyday rental operations.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.35 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
          >
            <Link href={`${AUTH_ROUTES.REGISTER}?role=landlord`} prefetch>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Button
                  size="lg"
                  className="h-14 min-w-[250px] rounded-full bg-primary px-8 text-lg font-medium text-white hover:bg-primary/90"
                >
                  Start Managing Your Properties
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </motion.div>
            </Link>
            <Link href="/how-it-works" prefetch>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-14 rounded-full px-6 text-lg font-medium text-gray-900 hover:bg-gray-50"
                >
                  See How It Works
                  <ArrowUpRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.45 }}
            className="mt-6 text-sm text-gray-400"
          >
            Built for landlords. Designed for simpler rental management.
          </motion.p>
        </motion.div>

        {/* Product visualization */}
        <motion.div
          style={prefersReducedMotion ? undefined : { y: visualY, scale: visualScale }}
          className="w-full max-w-[520px] lg:mx-0"
        >
          <PropertyManagementVisual />
        </motion.div>
      </div>
    </section>
  );
}
