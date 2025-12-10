'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ScrollToBottomButtonProps {
  onClick: () => void;
  show: boolean;
  unreadCount?: number;
}

export function ScrollToBottomButton({ onClick, show, unreadCount = 0 }: ScrollToBottomButtonProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClick}
          className="fixed bottom-24 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl active:scale-95"
        >
          {unreadCount > 0 ? (
            <div className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          ) : null}
          <ChevronDown className="h-6 w-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
