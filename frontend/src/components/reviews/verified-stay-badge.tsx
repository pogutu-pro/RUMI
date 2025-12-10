'use client';

import { Shield, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VerifiedStayBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export default function VerifiedStayBadge({ className, size = 'md' }: VerifiedStayBadgeProps) {
  const isSmall = size === 'sm';
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        'bg-emerald-50 text-emerald-700 border border-emerald-200',
        'font-medium transition-all duration-200',
        'hover:bg-emerald-100 hover:border-emerald-300',
        'group cursor-help',
        isSmall && 'px-2 py-0.5 text-xs',
        className
      )}
      title="Verified Stay - This reviewer completed their booking at this hostel"
    >
      <Shield className={cn(
        'group-hover:rotate-12 transition-transform duration-200',
        isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'
      )} />
      <span className={isSmall ? 'text-xs' : 'text-sm'}>
        Verified Stay
      </span>
      <CheckCircle2 className={cn(
        'text-emerald-600',
        isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'
      )} />
    </motion.div>
  );
}
