'use client';

import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Building2, 
  Search, 
  CreditCard, 
  ShieldCheck, 
  LayoutDashboard, 
  LineChart, 
  Smartphone, 
  Sparkles,
  ArrowUpRight,
  ClipboardList,
  Zap,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/constants/routes';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const LANDLORD_JOURNEY = [
  {
    tier: 'CORE',
    title: 'Digitize Operations',
    tagline: 'Moving from paperwork to precision.',
    icon: <ClipboardList className="h-6 w-6" />,
    description: 'Transform your scattered records into a clean, digital database. Manage students, beds, and occupancy in real-time.',
    features: ['Student & bed records', 'Occupancy status', 'Landlord dashboard', 'Public listing visibility'],
    color: 'emerald'
  },
  {
    tier: 'CONTROL',
    title: 'Automate Management',
    tagline: 'Know what’s paid, what’s not, and why.',
    icon: <Zap className="h-6 w-6" />,
    description: 'Layer on automation for complex workflows. Track every payment, room transfer, and student movement without lifting a finger.',
    features: ['Rent verification history', 'Room transfers tracking', 'Document exports', 'Advanced analytics'],
    color: 'blue'
  },
  {
    tier: 'FINANCE',
    title: 'Scale with Rigor',
    tagline: 'Financial integrity at every level.',
    icon: <Briefcase className="h-6 w-6" />,
    description: 'For high-scale operators who require institutional-grade reporting, priority onboarding, and managed collections.',
    features: ['Compliance-ready reports', 'Priority 24/7 support', 'Collections onboarding', 'Risk-managed payouts'],
    color: 'slate'
  }
];

const STUDENT_JOURNEY = [
  {
    title: 'Find & Compare',
    description: 'Explore verified hostels with transparent pricing, real photos, and verified amenities near your campus.',
    icon: <Search className="h-6 w-6" />
  },
  {
    title: 'Secure Booking',
    description: 'Reserve your spot instantly via M-PESA. No middle-men, no hidden booking fees, just direct confirmation.',
    icon: <CreditCard className="h-6 w-6" />
  },
  {
    title: 'Managed Living',
    description: 'Access your rent history, request transfers, and receive instant notifications through your personal portal.',
    icon: <Smartphone className="h-6 w-6" />
  }
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-[120px] -z-10 opacity-60" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[100px] -z-10 opacity-40" />

        <div className="container mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">How RUMI Works</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9]"
          >
            The Operating System for <br className="hidden md:block" />
            <span className="text-emerald-600">Student Living.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-2xl text-slate-600 font-medium max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            A seamless ecosystem connecting landlords with students. Simple to use, powerful to scale, and built for clarity.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href={AUTH_ROUTES.REGISTER}>
              <Button size="lg" className="h-16 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold shadow-2xl shadow-emerald-200 transition-all hover:scale-105">
                Join the Network
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" className="h-16 px-8 text-slate-600 hover:text-slate-900 font-bold text-lg group">
                View Pricing <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* For Landlords: The Business Operating System */}
      <section className="py-32 px-4 bg-white border-y border-slate-100 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-4 py-1 rounded-full mb-6 font-bold uppercase tracking-widest text-[10px]">
                For Landlords
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">
                Your entire business <br /> in one place.
              </h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed">
                From basic records to institutional scaling, RUMI grows with your property portfolio.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-16 h-16 rounded-2xl bg-slate-50 border-4 border-white flex items-center justify-center shadow-lg overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid lg:grid-cols-3 gap-8"
          >
            {LANDLORD_JOURNEY.map((step, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                className="group relative p-10 rounded-[3rem] bg-[#F8FAFC] border border-slate-100 hover:border-emerald-200 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5"
              >
                <div className={`w-14 h-14 rounded-2xl mb-8 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                  step.color === 'emerald' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' :
                  step.color === 'blue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' :
                  'bg-slate-900 text-white shadow-lg shadow-slate-200'
                }`}>
                  {step.icon}
                </div>
                
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{step.tier}</span>
                  <div className="h-[1px] flex-1 bg-slate-100 mx-4" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm font-bold text-emerald-600 mb-6">{step.tagline}</p>
                <p className="text-slate-500 font-medium leading-relaxed mb-8 h-20">
                  {step.description}
                </p>
                
                <ul className="space-y-4 pt-8 border-t border-slate-200/50">
                  {step.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="text-sm font-bold text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* For Students: The Seamless Journey */}
      <section className="py-32 px-4 relative overflow-hidden bg-slate-900">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500 rounded-full blur-[160px]" />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-24">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1 rounded-full mb-6 font-bold uppercase tracking-widest text-[10px]">
              For Students
            </Badge>
            <h2 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-8">
              Find your home <br /> in seconds.
            </h2>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
              Skip the stress and the agents. Book directly from verified property owners.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-16"
          >
            {STUDENT_JOURNEY.map((step, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                className="text-center group"
              >
                <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-10 transition-all duration-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:border-emerald-400">
                  <div className="text-white group-hover:text-white transition-colors">
                    {step.icon}
                  </div>
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black mb-4 uppercase tracking-widest">
                  Step 0{i+1}
                </div>
                <h3 className="text-2xl font-black text-white mb-4">{step.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed px-4">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-24 text-center"
          >
            <Link href="/hostels">
              <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-slate-900 text-lg font-bold hover:bg-slate-50 transition-all hover:scale-105">
                Start Browsing Hostels
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-32 px-4 bg-[#F8FAFC]">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-[4rem] bg-slate-200 overflow-hidden shadow-2xl relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 mix-blend-overlay" />
                 <div className="absolute inset-0 flex items-center justify-center">
                   <ShieldCheck className="w-48 h-48 text-white/40" strokeWidth={1} />
                 </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-6 -right-6 p-6 rounded-3xl bg-white shadow-xl border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 tracking-tight">Verified Listings</p>
                  <p className="text-[10px] font-bold text-slate-500">Manual review for all</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">Built on Trust and <br /> Radical Transparency.</h2>
                <p className="text-xl text-slate-600 font-medium leading-relaxed">
                  We verify every property, every student, and every transaction. No fake listings, no "hidden" fees, no confusion.
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <LayoutDashboard className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Unified Portal</h4>
                  <p className="text-sm text-slate-500 font-medium">One login for everything: students, payments, and transfers.</p>
                </div>
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <LineChart className="h-5 w-5 text-orange-600" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Real-time Data</h4>
                  <p className="text-sm text-slate-500 font-medium">Instant updates on occupancy and rent collection status.</p>
                </div>
              </div>
              
              <div className="pt-8 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-900 mb-6 italic">"RUMI transformed how we handle our 200+ beds. No more spreadsheets, no more missing payments."</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200" />
                  <div>
                    <p className="text-sm font-black text-slate-900">David Mwangi</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Property Manager, Nairobi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 md:p-24 rounded-[4rem] bg-emerald-600 text-white shadow-[0_50px_100px_rgba(16,185,129,0.2)] relative overflow-hidden"
          >
            {/* Decorative background circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
            
            <h2 className="text-4xl md:text-7xl font-black tracking-tight mb-8 relative z-10">
              Ready to transform your hostel?
            </h2>
            <p className="text-xl md:text-2xl text-emerald-50 mb-12 font-medium opacity-90 relative z-10">
              Join the future of student housing management today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
              <Link href={AUTH_ROUTES.REGISTER}>
                <Button size="lg" className="h-16 px-12 rounded-2xl bg-white text-emerald-600 text-lg font-bold hover:bg-slate-50 shadow-xl transition-all hover:scale-105">
                  Get Started for Free
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="h-16 px-10 rounded-2xl border-emerald-400 text-white hover:bg-white/10 font-bold text-lg">
                  Talk to an Expert
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom Footer Text */}
      <footer className="py-12 border-t border-slate-100 text-center px-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          RUMI © 2026. THE STANDARD FOR STUDENT HOUSING.
        </p>
      </footer>
    </div>
  );
}
