'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Phone, HelpCircle, ArrowUpRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/constants/routes';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.215, 0.61, 0.355, 1] as const,
    },
  },
};

interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
  footerNote: string;
  variant: 'outline' | 'primary' | 'dark';
}

const PLANS: PricingPlan[] = [
  {
    id: 'core',
    name: 'CORE — Order & Records',
    tagline: 'Run your hostel without paperwork or confusion.',
    price: 50,
    features: [
      'Student & bed records',
      'Occupancy & rent status',
      'Caretaker & landlord dashboards',
      'Hostel listing & visibility',
    ],
    cta: 'Start Core',
    ctaLink: `${AUTH_ROUTES.REGISTER}?plan=core`,
    footerNote: 'Small hostels getting organized.',
    variant: 'outline',
  },
  {
    id: 'control',
    name: 'CONTROL — Truth & Verification',
    tagline: 'Know what’s paid, what’s not, and why.',
    price: 80,
    features: [
      'Everything in Core',
      'Rent verification & payment history',
      'Room transfers & student movement',
      'Advanced reports & exports',
    ],
    cta: 'Start Control',
    ctaLink: `${AUTH_ROUTES.REGISTER}?plan=control`,
    popular: true,
    footerNote: 'For landlords managing operations.',
    variant: 'primary',
  },
  {
    id: 'finance',
    name: 'FINANCE — Financial Reporting & Priority Support',
    tagline: 'Financial records and priority onboarding.',
    price: 150,
    features: [
      'Everything in Control',
      'Compliance-ready financial reports',
      'Priority onboarding & support',
      'Collections onboarding (by application)',
    ],
    cta: 'Apply for Finance',
    ctaLink: '/contact?subject=Finance%20Application',
    footerNote: 'For operators who require financial rigor.',
    variant: 'dark',
  },
];

const FAQS = [
  {
    q: 'Does KES 50 include SMS and email?',
    a: 'Yes. All tenant notifications are included—no separate communication fees.',
  },
  {
    q: 'When does Finance (collections) become available?',
    a: 'Collections are available by application after a short onboarding review. Apply from the Finance card.',
  },
  {
    q: 'Can I switch tiers?',
    a: 'Yes. Upgrade or downgrade from your dashboard; billing adjusts next invoice.',
  },
];

const PricingCard = ({ plan }: { plan: PricingPlan }) => {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "relative flex flex-col p-8 rounded-[2rem] transition-all duration-300",
        plan.variant === 'primary' 
          ? "bg-emerald-600 text-white shadow-2xl shadow-emerald-200 ring-4 ring-emerald-50 lg:scale-105 z-10" 
          : plan.variant === 'dark'
          ? "bg-slate-900 text-white"
          : "bg-white border border-slate-200 text-slate-900 shadow-sm hover:shadow-xl hover:border-slate-300"
      )}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-amber-400 hover:bg-amber-400 text-slate-900 font-bold px-4 py-1 rounded-full border-none shadow-lg whitespace-nowrap">
            MOST POPULAR
          </Badge>
        </div>
      )}

      <div className="mb-8">
        <h3 className={cn(
          "text-xs font-bold uppercase tracking-wider mb-2",
          plan.variant === 'outline' ? "text-emerald-600" : "text-emerald-300"
        )}>
          {plan.name.split(' — ')[0]}
        </h3>
        <p className={cn(
          "text-[10px] font-medium opacity-70 mb-6",
          plan.variant === 'outline' ? "text-slate-500" : "text-slate-300"
        )}>
          {plan.name.split(' — ')[1]}
        </p>
        
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-sm font-bold opacity-70">KES</span>
          <span className="text-5xl font-black tracking-tight">{plan.price}</span>
          <span className="text-sm font-medium opacity-70">/ bed / mo</span>
        </div>
        
        <p className={cn(
          "text-sm font-medium leading-relaxed min-h-[40px]",
          plan.variant === 'outline' ? "text-slate-600" : "text-slate-200"
        )}>
          {plan.tagline}
        </p>
      </div>

      <div className="space-y-4 mb-10 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">What&apos;s included</p>
        {plan.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={cn(
              "mt-1 p-0.5 rounded-full",
              plan.variant === 'outline' ? "bg-emerald-100 text-emerald-600" : "bg-white/20 text-white"
            )}>
              <Check className="h-3 w-3" />
            </div>
            <span className="text-sm font-medium leading-tight">{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-4">
        <Link href={plan.ctaLink} className="block w-full">
          <Button 
            className={cn(
              "w-full h-14 rounded-2xl text-base font-bold transition-all duration-300 group",
              plan.variant === 'primary' 
                ? "bg-white text-emerald-600 hover:bg-slate-50 shadow-lg" 
                : plan.variant === 'dark'
                ? "bg-emerald-500 text-white hover:bg-emerald-400 border-none"
                : "bg-slate-900 text-white hover:bg-slate-800"
            )}
          >
            {plan.cta}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
        <p className={cn(
          "text-[10px] text-center font-bold uppercase tracking-widest opacity-40",
          plan.variant === 'outline' ? "text-slate-500" : "text-white"
        )}>
          {plan.footerNote}
        </p>
      </div>
    </motion.div>
  );
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 mb-8"
          >
            <Badge variant="secondary" className="bg-emerald-500 text-white border-none text-[10px] px-2">PLAN</Badge>
            <span className="text-xs font-bold tracking-tight">Simple Pricing. Per occupied bed.</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6"
          >
            Pay only for beds that <br className="hidden md:block" />
            <span className="text-emerald-600">generate rent.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Start at KES 50 / occupied bed / month. All tenant notifications (SMS & email) are included. No surprise fees.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold shadow-xl shadow-emerald-200">
              Get started
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 font-bold group">
              Request demo <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Trial Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto mb-16 px-6 py-6 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">30-day free trial</h3>
                <p className="text-sm font-medium text-slate-600">Full access to Core and Control. No payment required.</p>
              </div>
            </div>
            <Link href={AUTH_ROUTES.REGISTER}>
              <Button className="h-12 px-8 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all">
                Claim trial
              </Button>
            </Link>
          </motion.div>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-3 gap-8 items-stretch"
          >
            {PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </motion.div>

          {/* Factual Notes */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-24 max-w-4xl mx-auto text-center"
          >
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Communications</p>
                <p className="text-sm font-medium text-slate-600">SMS & email tenant notifications included.</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Billing Model</p>
                <p className="text-sm font-medium text-slate-600">Billed monthly per occupied bed at invoice time.</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Discounts</p>
                <p className="text-sm font-medium text-slate-600">Multi-property & enterprise terms available.</p>
              </div>
            </div>
            
            <Link href="/contact" className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors group">
              Contact sales <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Micro FAQ Section */}
      <section className="py-32 px-4 bg-white border-t border-slate-100">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">Quick Questions</h2>
            <p className="text-slate-500 font-medium">Everything you need to know about our billing.</p>
          </div>
          
          <div className="space-y-16">
            {FAQS.map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 md:gap-8"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <HelpCircle className="h-6 w-6 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">{faq.a}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-24 p-8 md:p-10 rounded-[2.5rem] bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Phone className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">Still have questions?</p>
                <p className="text-sm font-medium text-slate-500">We&apos;re here to help you get started.</p>
              </div>
            </div>
            <Link href="/contact">
              <Button variant="outline" className="h-12 px-8 rounded-xl border-slate-200 font-bold hover:bg-white hover:border-slate-300 transition-all">Contact us</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer / Legal */}
      <footer className="py-16 border-t border-slate-100 text-center px-4 bg-white">
        <div className="container mx-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">
            Prices exclude VAT where applicable. <Link href="/terms" className="underline hover:text-slate-600 transition-colors">Terms and service apply</Link>.
          </p>
        </div>
      </footer>

      {/* Product Education Link */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <Link href="/how-it-works">
          <motion.div 
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white/80 backdrop-blur-md px-6 py-3.5 rounded-full border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Curious how it works?</span>
            <div className="h-4 w-[1px] bg-slate-200" />
            <span className="text-[11px] font-bold text-emerald-600 flex items-center uppercase tracking-wider">
              See the tour <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
