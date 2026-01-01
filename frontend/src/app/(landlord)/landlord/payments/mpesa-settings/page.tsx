'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Plus, ArrowLeft, Info, BadgeCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MpesaSettingsList } from '@/features/payments/components/mpesa-settings-list';
import { MpesaSettingsForm } from '@/features/payments/components/mpesa-settings-form';
import Link from 'next/link';

export default function MpesaSettingsPage() {
  const [view, setView] = React.useState<'list' | 'create'>('list');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="max-w-5xl mx-auto space-y-8 pb-20 px-4 sm:px-6 pt-6 font-sans"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
                <Link href="/landlord/payments" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Back to Payments
                </Link>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                            M-Pesa Settings
                        </h1>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Configure how you receive payments from tenants. Add your Till Numbers or Paybills here.
                    </p>
                </div>

                {view === 'list' && (
                    <Button 
                        onClick={() => setView('create')}
                        className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 text-base"
                    >
                        <Plus className="mr-2 h-5 w-5" /> Add New Method
                    </Button>
                )}
            </div>
        </motion.div>

        {/* Informational Cards */}
        {view === 'list' && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-500/5 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 flex gap-4">
                    <BadgeCheck className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-emerald-900 dark:text-emerald-400 text-base">Automatic Verification</h3>
                        <p className="text-emerald-800/80 dark:text-emerald-400/80 text-sm mt-1 leading-relaxed font-medium">
                            Payments made to these numbers are automatically detected and receipted in real-time.
                        </p>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/5 p-5 rounded-2xl border border-blue-100 dark:border-blue-500/10 flex gap-4">
                    <ShieldCheck className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-400 text-base">Secure Configuration</h3>
                        <p className="text-blue-800/80 dark:text-blue-400/80 text-sm mt-1 leading-relaxed font-medium">
                            Your payment details are encrypted. Only authorized tenants can view these payment details.
                        </p>
                    </div>
                </div>
            </motion.div>
        )}

        {/* Content Area */}
        <motion.div variants={itemVariants} className="min-h-[400px]">
             {view === 'list' ? (
                 <MpesaSettingsList onEdit={() => {}} />
             ) : (
                 <MpesaSettingsForm 
                    onSuccess={() => setView('list')} 
                    onCancel={() => setView('list')} 
                 />
             )}
        </motion.div>

    </motion.div>
  );
}
