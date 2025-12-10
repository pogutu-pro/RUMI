'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showToast) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border
          ${isOnline 
            ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-800 dark:text-green-300' 
            : 'bg-red-100 border-red-200 text-red-700 dark:bg-red-900/50 dark:border-red-800 dark:text-red-300'
          }
        `}>
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {isOnline ? 'Back Online' : 'No Internet Connection'}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
