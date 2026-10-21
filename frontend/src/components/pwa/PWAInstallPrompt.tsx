'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Smart TVs, streaming boxes and game consoles ship Chromium-based browsers
// that fire `beforeinstallprompt` just like a phone does, but "installing"
// a rental-management app on a television makes no sense — and the corner
// card looked exactly like a bug when RumiaRent was shown on a Hisense TV.
// Match on their own user-agent tokens, never on screen size (a TV's
// browser reports a normal desktop-sized viewport).
const NON_INSTALLABLE_DEVICE =
  /SmartTV|SMART-TV|Tizen|WebOS|VIDAA|HbbTV|NetCast|GoogleTV|BRAVIA|AFTB|AFTA|AFTM|AFTT|AFTS|CrKey|Roku|PlayStation|Xbox|Nintendo|\bTV\b/i;

/** Read once on mount; nothing here changes for the life of the page. */
function detectEnvironment(): { isTV: boolean; isIOSDevice: boolean; isStandalone: boolean } {
  if (typeof window === 'undefined') {
    return { isTV: false, isIOSDevice: false, isStandalone: false };
  }
  const userAgent = window.navigator.userAgent;
  return {
    isTV: NON_INSTALLABLE_DEVICE.test(userAgent),
    isIOSDevice: /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream,
    isStandalone:
      window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone,
  };
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  // These read a stable browser value once on mount — computed as lazy
  // initializers instead of set from inside an effect, so there is no
  // synchronous setState in the effect body below. `typeof window` is
  // undefined during SSR, so all of this stays false until the client's
  // first render, same as before.
  const [isMobile] = useState(
    () =>
      typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  );
  const [isIOS] = useState(() => {
    const { isTV, isIOSDevice } = detectEnvironment();
    return !isTV && isIOSDevice;
  });
  const [showPrompt, setShowPrompt] = useState(() => {
    const { isTV, isIOSDevice, isStandalone } = detectEnvironment();
    if (isTV || !isIOSDevice || isStandalone) return false;
    return typeof window !== 'undefined' && !localStorage.getItem('pwa-prompt-dismissed');
  });

  // Standard PWA install prompt (Android/Chrome/Desktop) — a real
  // subscription to a browser event, so this one belongs in an effect.
  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    if (NON_INSTALLABLE_DEVICE.test(userAgent)) return;

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
               Look for <Upload className="w-3 h-3 inline mx-1" /> then &quot;Add to Home Screen&quot; <div className="w-4 h-4 border border-zinc-300 rounded mx-1 flex items-center justify-center">+</div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
