'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, X, ArrowRight, Sparkles, Building2, Zap, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/constants/routes';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

type BillingCycle = 'monthly' | 'yearly';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: PlanFeature[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
  comingSoon?: boolean;
  icon: React.ElementType;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for testing and light usage.',
    price: { monthly: 0, yearly: 0 },
    features: [
      { text: 'Browse all hostels', included: true },
      { text: 'Basic search filters', included: true },
      { text: 'Direct messaging', included: true },
      { text: 'Premium analytics', included: false },
      { text: 'Priority support', included: false },
      { text: 'Verified badge', included: false },
    ],
    cta: 'Try Free',
    ctaLink: `${AUTH_ROUTES.REGISTER}?plan=free`,
    icon: Building2,
    gradientFrom: '#6B7280',
    gradientTo: '#9CA3AF',
    glowColor: 'rgba(107, 114, 128, 0.3)',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For serious students and landlords.',
    price: { monthly: 1200, yearly: 12240 },
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Advanced search filters', included: true },
      { text: 'Priority booking', included: true },
      { text: 'Verified badge', included: true },
      { text: 'Premium analytics', included: false },
      { text: 'Dedicated account manager', included: false },
    ],
    cta: 'Get Started',
    ctaLink: `${AUTH_ROUTES.REGISTER}?plan=pro`,
    popular: true,
    icon: Zap,
    gradientFrom: '#10B981',
    gradientTo: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Power users who need more control.',
    price: { monthly: 2400, yearly: 24480 },
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Premium analytics', included: true },
      { text: 'Bulk messaging', included: true },
      { text: 'Multiple property listings', included: true },
      { text: 'Priority 24/7 support', included: true },
      { text: 'API access', included: false },
    ],
    cta: 'Upgrade Now',
    ctaLink: `${AUTH_ROUTES.REGISTER}?plan=advanced`,
    icon: Shield,
    gradientFrom: '#3B82F6',
    gradientTo: '#1D4ED8',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations.',
    price: { monthly: 0, yearly: 0 },
    features: [
      { text: 'Everything in Advanced', included: true },
      { text: 'Custom API integration', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'SLA guarantees', included: true },
      { text: 'Custom contracts', included: true },
      { text: 'White-labeling', included: true },
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact',
    comingSoon: true,
    icon: Sparkles,
    gradientFrom: '#A855F7',
    gradientTo: '#7C3AED',
    glowColor: 'rgba(168, 85, 247, 0.4)',
  },
];

// Animated gradient background component
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-cyan-50/80" />
      
      {/* Animated orbs */}
      <motion.div
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/4 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/20 blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-gradient-to-br from-teal-400/20 to-emerald-400/20 blur-3xl"
        animate={{
          x: [0, -60, 0],
          y: [0, -80, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
    </div>
  );
};

// Pricing card component with 3D tilt effect
const PricingCard = ({ plan, billingCycle }: { plan: PricingPlan; billingCycle: BillingCycle }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        "group relative h-full",
        plan.popular && "md:scale-105"
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
      }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative h-full flex flex-col rounded-3xl border transition-all duration-500",
          "bg-white shadow-lg",
          plan.popular 
            ? "border-emerald-200/50 shadow-2xl shadow-emerald-500/10 hover:shadow-emerald-500/20" 
            : "border-gray-200/50 shadow-lg hover:shadow-xl",
          plan.comingSoon && "opacity-75"
        )}
      >
        {/* Gradient border overlay */}
        <div 
          className={cn(
            "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10",
            "bg-gradient-to-br p-[2px]"
          )}
          style={{
            backgroundImage: `linear-gradient(135deg, ${plan.gradientFrom}, ${plan.gradientTo})`,
          }}
        >
          <div className="h-full w-full rounded-3xl bg-white" />
        </div>

        {/* Glow effect on popular card */}
        {plan.popular && (
          <motion.div
            className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-20"
            style={{
              background: `radial-gradient(circle at center, ${plan.glowColor}, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        <div className="relative p-8 flex flex-col h-full">
          {/* Popular badge */}
          {plan.popular && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 shadow-lg text-white px-5 py-1.5 text-sm font-semibold">
                  <Star className="h-3.5 w-3.5 mr-1 fill-current" />
                  Most Popular
                </Badge>
              </motion.div>
            </div>
          )}

          {/* Coming soon badge */}
          {plan.comingSoon && (
            <div className="absolute top-6 right-6">
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs px-3 py-1">
                Coming Soon
              </Badge>
            </div>
          )}

          {/* Icon and title */}
          <div className="mb-6">
            <motion.div 
              className={cn(
                "mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl",
                "bg-gradient-to-br shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
              )}
              style={{
                backgroundImage: `linear-gradient(135deg, ${plan.gradientFrom}, ${plan.gradientTo})`,
              }}
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <plan.icon className="h-7 w-7 text-white" />
            </motion.div>
            <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{plan.name}</h3>
            <p className="text-base font-bold text-gray-800 leading-relaxed tracking-tight">{plan.description}</p>
          </div>

          {/* Price */}
          <div className="mb-8">
            {plan.comingSoon ? (
              <div className="text-5xl font-black text-gray-900 tracking-tight">
                Custom
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black text-gray-700">KES</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={billingCycle}
                    initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="text-6xl font-black text-gray-900 tracking-tight"
                  >
                    {plan.price[billingCycle].toLocaleString()}
                  </motion.span>
                </AnimatePresence>
                <span className="text-base font-black text-gray-700 ml-1">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
            )}
            {!plan.comingSoon && plan.id === 'free' && (
              <p className="mt-2 text-sm font-bold text-gray-600">No credit card required</p>
            )}
            {!plan.comingSoon && plan.id !== 'free' && billingCycle === 'yearly' && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Save {Math.round((1 - (plan.price.yearly / (plan.price.monthly * 12))) * 100)}%
              </motion.p>
            )}
          </div>

          {/* Features */}
          <ul className="mb-8 space-y-4 flex-1">
            {plan.features.map((feature, idx) => (
              <motion.li 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className="flex items-start gap-3"
              >
                {feature.included ? (
                  <motion.div 
                    className="mt-0.5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 p-1 shadow-sm"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <div className="mt-0.5 rounded-full bg-gray-100 p-1">
                    <X className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
                  </div>
                )}
                <span className={cn(
                  "text-base leading-relaxed font-bold tracking-tight",
                  feature.included ? "text-gray-900" : "text-gray-400"
                )}>
                  {feature.text}
                </span>
              </motion.li>
            ))}
          </ul>

          {/* CTA Button */}
          <Link href={plan.ctaLink} className={cn("mt-auto", plan.comingSoon && "pointer-events-none")}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                className={cn(
                  "w-full h-12 text-base font-semibold transition-all duration-300 shadow-lg",
                  plan.popular 
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white hover:shadow-xl hover:shadow-emerald-500/30" 
                    : "bg-white text-gray-900 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-xl",
                  plan.comingSoon && "opacity-50 cursor-not-allowed"
                )}
                disabled={plan.comingSoon}
              >
                <span className="flex items-center justify-center gap-2">
                  {plan.cta}
                  {!plan.comingSoon && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </span>
              </Button>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-8 pb-8 md:pt-12 md:pb-10">
        <AnimatedBackground />
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="container mx-auto px-4 text-center relative z-10"
        >
          <motion.div variants={itemVariants} className="mb-6 flex justify-center">
            <Badge variant="secondary" className="rounded-full px-5 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50/80 backdrop-blur-sm border-emerald-200/50 shadow-sm">
              💎 Pricing Plans
            </Badge>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants} 
            className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-7xl lg:text-8xl"
          >
            Choose the plan that <br className="hidden md:block" />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 animate-gradient">
                fits your ambition
              </span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
              />
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants} 
            className="mx-auto mb-12 max-w-2xl text-lg text-gray-600 md:text-xl leading-relaxed"
          >
            Simple, transparent pricing that grows with you. Try any plan free for 14 days. 
            No hidden fees. Cancel anytime.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div 
            variants={itemVariants} 
            className="flex items-center justify-center gap-4 mb-6"
          >
            <span className={cn(
              "text-base font-semibold transition-all duration-300",
              billingCycle === 'monthly' ? "text-gray-900 scale-105" : "text-gray-500"
            )}>
              Monthly
            </span>
            <div className="relative">
              <Switch
                checked={billingCycle === 'yearly'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-600 data-[state=checked]:to-teal-600 shadow-lg"
              />
            </div>
            <span className={cn(
              "text-base font-semibold transition-all duration-300 flex items-center gap-2",
              billingCycle === 'yearly' ? "text-gray-900 scale-105" : "text-gray-500"
            )}>
              Yearly
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Save 15%
              </Badge>
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 md:pb-20 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto"
          >
            {PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} billingCycle={billingCycle} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social Proof / Trusted By */}
      <section className="py-16 border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-50/30 via-transparent to-transparent" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-bold text-gray-500 mb-8 uppercase tracking-widest"
          >
            Trusted by students from
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.1 }}
            className="flex flex-wrap justify-center items-center gap-12 md:gap-20"
          >
            {['UoN', 'Strathmore', 'KU', 'JKUAT', 'Daystar'].map((university, idx) => (
              <motion.span 
                key={university}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.1, opacity: 1 }}
                className="text-2xl md:text-3xl font-bold text-gray-400 hover:text-gray-600 transition-all duration-300 cursor-default"
              >
                {university}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
