'use client';

import * as React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, Award, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TrustBadgeProps {
  type: 'verified' | 'top_rated' | 'secure_payment' | 'fast_response' | 'identity_verified';
  className?: string;
}

const BADGE_CONFIG = {
  verified: {
    icon: ShieldCheck,
    label: 'RUMI Verified',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    description: 'Property inspected and verified by RUMI staff'
  },
  top_rated: {
    icon: Award,
    label: 'Top Rated',
    color: 'text-amber-600 bg-amber-50 border-amber-100',
    description: 'Consistently high ratings from residents'
  },
  secure_payment: {
    icon: CheckCircle2,
    label: 'Secure Payment',
    color: 'text-blue-600 bg-blue-50 border-blue-100',
    description: 'All payments protected by RUMI Escrow'
  },
  fast_response: {
    icon: Zap,
    label: 'Fast Response',
    color: 'text-purple-600 bg-purple-50 border-purple-100',
    description: 'Landlord usually responds within 2 hours'
  },
  identity_verified: {
    icon: CheckCircle2,
    label: 'ID Verified',
    color: 'text-slate-600 bg-slate-50 border-slate-100',
    description: 'Landlord identity documents verified'
  }
};

export default function TrustBadges({ points }: { points: Array<keyof typeof BADGE_CONFIG> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {points.map((point, index) => {
        const config = BADGE_CONFIG[point];
        if (!config) return null;
        const Icon = config.icon;

        return (
          <motion.div
            key={point}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-md",
              config.color
            )}
          >
            <div className="p-2 rounded-lg bg-white/50 shadow-sm flex-shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm mb-0.5">{config.label}</p>
              <p className="text-xs opacity-80 leading-relaxed font-medium">
                {config.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
