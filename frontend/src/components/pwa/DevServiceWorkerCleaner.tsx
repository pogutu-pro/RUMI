'use client';

import { useEffect } from 'react';

export default function DevServiceWorkerCleaner() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV === 'development') {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            console.log('Unregistering SW in dev mode:', registration);
            registration.unregister();
          }
        });
      }
    }
  }, []);

  return null;
}
