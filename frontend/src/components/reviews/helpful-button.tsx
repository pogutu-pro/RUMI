'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpfulButtonProps {
  count: number;
  isHelpful?: boolean;
  onToggle?: () => void;
  size?: 'sm' | 'md';
}

export default function HelpfulButton({ 
  count, 
  isHelpful, 
  onToggle,
  size = 'md' 
}: HelpfulButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const isSmall = size === 'sm';
  
  const handleClick = () => {
    if (!onToggle) return;
    setIsAnimating(true);
    onToggle();
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={!onToggle}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all duration-200',
        isHelpful
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300',
        !onToggle && 'cursor-default',
        isSmall ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      )}
    >
      <motion.div
        animate={isAnimating ? { 
          scale: [1, 1.3, 1],
          rotate: [0, -10, 10, 0]
        } : {}}
        transition={{ duration: 0.3 }}
      >
        <ThumbsUp 
          className={cn(
            'transition-all',
            isHelpful && 'fill-current',
            isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4'
          )} 
        />
      </motion.div>
      <span>
        Helpful {count > 0 && `(${count})`}
      </span>
    </motion.button>
  );
}
