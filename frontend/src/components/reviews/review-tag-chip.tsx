'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReviewTag } from '@/types/entities.types';
import { 
  Sparkles, 
  Wifi, 
  Shield, 
  MapPin, 
  DollarSign, 
  User, 
  Volume2, 
  Home,
  Wrench
} from 'lucide-react';

interface ReviewTagChipProps {
  tag: ReviewTag;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

const tagConfig: Record<ReviewTag, { label: string; icon: any; color: string }> = {
  cleanliness: { label: 'Clean', icon: Sparkles, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  wifi: { label: 'WiFi', icon: Wifi, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  safety: { label: 'Safe', icon: Shield, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  location: { label: 'Location', icon: MapPin, color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
  value: { label: 'Value', icon: DollarSign, color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
  landlord: { label: 'Landlord', icon: User, color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
  quiet: { label: 'Quiet', icon: Volume2, color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
  facilities: { label: 'Facilities', icon: Home, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  maintenance: { label: 'Maintenance', icon: Wrench, color: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100' },
};

export default function ReviewTagChip({ tag, selected, onClick, size = 'md' }: ReviewTagChipProps) {
  const config = tagConfig[tag];
  const Icon = config.icon;
  const isSmall = size === 'sm';
  
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        'transition-all duration-200',
        config.color,
        selected && 'ring-2 ring-offset-1',
        !onClick && 'cursor-default',
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      )}
    >
      <Icon className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span>{config.label}</span>
    </motion.button>
  );
}
