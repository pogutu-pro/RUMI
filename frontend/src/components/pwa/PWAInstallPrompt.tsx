'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    setIsMobile(mobile);

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isIOSDevice && !isStandalone) {
      setIsIOS(true);
      const isDismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!isDismissed) {
        setShowPrompt(true);
      }
    }

    // Standard PWA (Android/Chrome/Desktop)
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
              <div className="bg-primary/10 p-2 rounded-md">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {isIOS ? 'Install RumiaRent on iOS' : isMobile ? 'Install App' : 'Install Desktop App'}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {isIOS
                    ? 'Tap the Share button and select "Add to Home Screen"'
                    : isMobile
                      ? 'Install RumiaRent for a better mobile experience.'
                      : 'Install RumiaRent on your desktop for quick access.'}
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
          
          {!isIOS && (
            <Button 
              onClick={handleInstallClick}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Install
            </Button>
          )}
          
          {isIOS && (
            <div className="text-xs text-zinc-400 flex items-center justify-center gap-1 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded">
               Look for <Upload className="w-3 h-3 inline mx-1" /> then "Add to Home Screen" <div className="w-4 h-4 border border-zinc-300 rounded mx-1 flex items-center justify-center">+</div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
