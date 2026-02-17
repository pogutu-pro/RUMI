'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Plus, ArrowLeft, Info, BadgeCheck, ShieldCheck, Sparkles, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MpesaSettingsList } from '@/features/payments/components/mpesa-settings-list';
import { MpesaSettingsForm } from '@/features/payments/components/mpesa-settings-form';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function MpesaSettingsPage() {
  const [view, setView] = React.useState<'list' | 'create'>('list');
  const searchParams = useSearchParams();
  const isNewHostel = searchParams.get('redirectReason') === 'new_hostel';

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
        {/* Welcome Banner for New Hostels */}
        {isNewHostel && (
            <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-xl shadow-emerald-200/50 text-white relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <Sparkles className="h-24 w-24" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                        <BadgeCheck className="h-10 w-10" />
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-black mb-2">Hostel Saved Successfully!</h2>
                        <p className="text-emerald-50 font-medium max-w-xl leading-relaxed">
                            One last step: add your M-Pesa Till or Paybill number below. This will allow students 
                            to see exactly where to pay when they book your room.
                        </p>
                    </div>
                    <Button 
                        variant="secondary" 
                        size="lg"
                        className="md:ml-auto h-12 px-6 rounded-xl font-bold bg-white text-emerald-600 hover:bg-emerald-50 border-none shadow-lg"
                        onClick={() => setView('create')}
                    >
                        Start Setup Now
                    </Button>
                </div>
            </motion.div>
        )}

        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <Link href="/landlord/hostels" className="hover:text-success transition-colors flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Back to Hostels
                </Link>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-success/10 rounded-xl flex items-center justify-center text-success">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
                            M-Pesa Settings
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
                        Configure how you receive payments from tenants. Add your Till Numbers or Paybills here.
                    </p>
                </div>

                {view === 'list' && (
                    <Button 
                        onClick={() => setView('create')}
                        className="h-14 px-8 rounded-2xl bg-success hover:bg-success/90 text-success-foreground font-bold shadow-lg shadow-success/20 text-base"
                    >
                        <Plus className="mr-2 h-5 w-5" /> Add New Method
                    </Button>
                )}
            </div>
        </motion.div>

        {/* Setup Guide for Elderly Landlords */}
        {view === 'create' && (
            <motion.div 
                variants={itemVariants}
                className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4 shadow-sm"
            >
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                    <Lightbulb className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-bold text-amber-900 text-lg">Simple Setup Guide</h3>
                    <div className="mt-2 space-y-3">
                        <div className="flex items-start gap-2">
                             <div className="h-5 w-5 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-700 mt-0.5">1</div>
                             <p className="text-amber-800 font-medium">Select your method (Paybill or Buy Goods/Till).</p>
                        </div>
                        <div className="flex items-start gap-2">
                             <div className="h-5 w-5 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-700 mt-0.5">2</div>
                             <p className="text-amber-800 font-medium">Enter the number exactly as it appears on your M-Pesa menu.</p>
                        </div>
                        <div className="flex items-start gap-2">
                             <div className="h-5 w-5 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-700 mt-0.5">3</div>
                             <p className="text-amber-800 font-medium">Save, and you're ready to receive payments!</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}

        {/* Informational Cards */}
        {view === 'list' && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-success/10 p-5 rounded-2xl border border-success/20 flex gap-4">
                    <BadgeCheck className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-success text-base">Automatic Verification</h3>
                        <p className="text-success/80 text-sm mt-1 leading-relaxed font-medium">
                            Payments made to these numbers are automatically detected and receipted in real-time.
                        </p>
                    </div>
                </div>
                <div className="bg-info/10 p-5 rounded-2xl border border-info/20 flex gap-4">
                    <ShieldCheck className="h-6 w-6 text-info flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-info text-base">Secure Configuration</h3>
                        <p className="text-info/80 text-sm mt-1 leading-relaxed font-medium">
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
