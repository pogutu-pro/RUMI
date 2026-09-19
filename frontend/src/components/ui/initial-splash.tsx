'use client';

import * as React from 'react';
import { RumiaLoader } from '@/components/ui/rumia-loader';
import { cn } from '@/lib/utils/cn';

/** Long enough for the logo to draw in and be seen, short enough not to nag. */
const MIN_VISIBLE_MS = 1500;
const FADE_MS = 400;

/**
 * Full-screen branded splash shown on a hard page load. It is part of the
 * server-rendered HTML, so visitors see the animated logo instead of a blank
 * page while the app downloads and hydrates; once React is running it holds
 * for a moment, fades out and removes itself. Client-side route changes do
 * not re-trigger it (this component only mounts once per full load).
 */
export function InitialSplash() {
  const [phase, setPhase] = React.useState<'visible' | 'fading' | 'gone'>('visible');

  React.useEffect(() => {
    const fadeTimer = window.setTimeout(() => setPhase('fading'), MIN_VISIBLE_MS);
    const goneTimer = window.setTimeout(() => setPhase('gone'), MIN_VISIBLE_MS + FADE_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(goneTimer);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      aria-hidden={phase === 'fading'}
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity',
        phase === 'fading' ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <RumiaLoader size={112} text="Preparing your RumiaRent experience" label="Loading RumiaRent" />
    </div>
  );
}
