'use client';

import { useEffect, useRef, useState } from 'react';

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(config: Record<string, unknown>): void;
      renderButton(el: HTMLElement, options: Record<string, unknown>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null; // let a later render try again
        reject(new Error('Google sign-in could not load'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

interface GoogleButtonProps {
  clientId: string;
  onCredential: (credential: string) => void;
  text?: 'continue_with' | 'signin_with' | 'signup_with';
}

/**
 * Google's own "Continue with Google" button (Google Identity Services).
 * It hands back a signed ID token that the backend verifies; nothing else
 * from the Google account is shared.
 */
export function GoogleButton({ clientId, onCredential, text = 'continue_with' }: GoogleButtonProps) {
  const holder = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        const el = holder.current;
        if (cancelled || !el || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            if (response.credential) callback.current(response.credential);
          },
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        el.innerHTML = '';
        window.google.accounts.id.renderButton(el, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          logo_alignment: 'center',
          width: Math.min(400, Math.max(200, el.offsetWidth)),
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (failed) {
    return <p className="text-center text-sm text-muted-foreground">Google sign-in did not load. Use your email below.</p>;
  }
  // Fixed height so the form does not jump when Google's iframe arrives.
  return <div ref={holder} className="flex h-11 w-full justify-center overflow-hidden" />;
}
