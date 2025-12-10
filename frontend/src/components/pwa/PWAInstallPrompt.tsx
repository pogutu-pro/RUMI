'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user has already dismissed it recently
      const isDismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    // Re-show after 7 days (optional logic could be added here)
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
      >
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-md">
                <Download className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Install App</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Install RUMI for a better experience.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Button 
            onClick={handleInstallClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Install
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
