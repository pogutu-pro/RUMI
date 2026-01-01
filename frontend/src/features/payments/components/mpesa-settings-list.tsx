'use client';

import * as React from 'react';
import { Smartphone, Trash2, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useMpesaConfigs } from '../hooks/use-payments';
import { MpesaConfig } from '../types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MpesaSettingsListProps {
  onEdit: (config: MpesaConfig) => void;
}

export function MpesaSettingsList({ onEdit }: MpesaSettingsListProps) {
  const { data: configs, isLoading } = useMpesaConfigs();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!configs || configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
        <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Payment Methods Configured</h3>
        <p className="text-slate-500 text-center max-w-sm mb-6">
          You haven't added any M-Pesa payment details yet. Add one to start tracking payments automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <AnimatePresence>
      {configs.map((config) => (
        <motion.div
            key={config.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            layout
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:border-emerald-500/30"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                  config.is_default ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}>
                <Smartphone className="h-6 w-6" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{config.business_name}</h3>
                  {config.is_default && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-none">Default</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                   <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">{config.payment_type.replace('_', ' ')}</span>
                   </div>
                   <span className="font-mono font-bold tracking-wide text-slate-900 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 py-1 px-2 rounded-md">{config.mpesa_number}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
                {/* 
                  TODO: Add functionality for edit/delete if API supports it later.
                  For now, we might just be viewing. But the design should show readiness.
                 */}
                 {/* <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    <Edit2 className="h-4 w-4" />
                 </Button> */}
            </div>
          </div>
        </motion.div>
      ))}
      </AnimatePresence>
    </div>
  );
}
