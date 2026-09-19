'use client';

import * as React from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUnlock } from '../hooks/use-platform-settings';

/** Step-up check: even a signed-in super admin must re-enter their password to open Integrations. */
export function PasswordGate() {
  const unlock = useUnlock();
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setError('');
    try {
      await unlock.mutateAsync(password);
      setPassword('');
    } catch (err) {
      setError((err as { message?: string })?.message || 'That password is not correct.');
      setPassword('');
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-5 rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Confirm it is you</h2>
        <p className="text-sm text-muted-foreground">
          Integrations holds the keys to payments, texts and email. Enter your super admin password to open it. It
          locks again after 10 minutes.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="integrations-password">Your password</Label>
          <Input
            id="integrations-password"
            type="password"
            autoFocus
            autoComplete="current-password"
            className="h-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-destructive">
              <ShieldAlert className="h-4 w-4" />
              {error}
            </p>
          )}
        </div>
        <Button type="submit" className="h-11 w-full" isLoading={unlock.isPending} disabled={!password || unlock.isPending}>
          Open Integrations
        </Button>
      </form>
    </div>
  );
}
