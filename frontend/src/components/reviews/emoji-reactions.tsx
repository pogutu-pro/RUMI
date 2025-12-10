'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReviewReaction } from '@/types/entities.types';

interface EmojiReactionsProps {
  reactions: ReviewReaction[];
  onReact?: (emoji: ReviewReaction['emoji']) => void;
  size?: 'sm' | 'md';
}

export default function EmojiReactions({ reactions, onReact, size = 'md' }: EmojiReactionsProps) {
  const isSmall = size === 'sm';
  
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {reactions.map((reaction) => (
        <motion.button
          key={reaction.emoji}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => onReact?.(reaction.emoji)}
          disabled={!onReact}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border transition-all duration-200',
            reaction.userReacted
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100',
            !onReact && 'cursor-default',
            isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
          )}
        >
          <span className={cn('leading-none', isSmall ? 'text-sm' : 'text-base')}>
            {reaction.emoji}
          </span>
          {reaction.count > 0 && (
            <span className="font-medium">
              {reaction.count}
            </span>
          )}
        </motion.button>
      ))}
    </div>
  );
}
