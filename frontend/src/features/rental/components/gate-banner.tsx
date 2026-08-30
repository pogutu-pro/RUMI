'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { GateRejection, capitalizeTier, gateBannerTitle } from '@/lib/api/gate';

interface GateBannerProps {
  gate: GateRejection;
  onDismiss: () => void;
}

/**
 * Shared inline banner reflecting a D-10 gate-rejection 403. This is UX-only
 * upsell messaging — it is never the security boundary, that's plan
 * 03-01's backend GatingService. Never styled as an error (no destructive
 * variant) since a gate rejection is an upsell moment, not a failure.
 */
export function GateBanner({ gate, onDismiss }: GateBannerProps) {
  return (
    <Alert className="border-warning/30 bg-warning/10">
      <Lock className="h-4 w-4 text-warning" />
      <AlertTitle>{gateBannerTitle(gate)}</AlertTitle>
      <AlertDescription>
        <p>{gate.detail}</p>
        <p>Upgrade to {capitalizeTier(gate.required_tier)} to unlock this.</p>
      </AlertDescription>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href="/pricing">See plans</Link>
        </Button>
        <Button variant="ghost" onClick={onDismiss}>
          Not now
        </Button>
      </div>
    </Alert>
  );
}
