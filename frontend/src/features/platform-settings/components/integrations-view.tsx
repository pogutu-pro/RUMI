'use client';

import * as React from 'react';
import { CheckCircle2, KeyRound, Lock, LockOpen, Send, ShieldCheck, TriangleAlert, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusPill } from '@/components/ui/status-pill';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils/cn';
import {
  useConnectionTest,
  useLock,
  usePlatformSettings,
  useResetSetting,
  useSaveSetting,
  useUnlockStatus,
} from '../hooks/use-platform-settings';
import { PasswordGate } from './password-gate';
import { SocialLinksSection } from './social-links-section';
import { TaxRatesSection } from './tax-rates-section';
import type { ConnectionTestResult, PlatformSetting, SettingGroup } from '../types';

const TESTS: Record<string, { kind: 'paystack' | 'email' | 'sms'; label: string; note?: string } | undefined> = {
  paystack: { kind: 'paystack', label: 'Test connection' },
  email: { kind: 'email', label: 'Send me a test email' },
  sms: { kind: 'sms', label: 'Send me a test text', note: 'Uses one text message from your balance.' },
};

function SourcePill({ setting }: { setting: PlatformSetting }) {
  if (setting.unreadable) return <StatusPill status="danger">Cannot be read: enter it again</StatusPill>;
  if (setting.source === 'dashboard') return <StatusPill status="success">Set here</StatusPill>;
  if (setting.source === 'server') return <StatusPill status="info">From the server file</StatusPill>;
  return <StatusPill status="warning">Not set</StatusPill>;
}

function currentText(setting: PlatformSetting): string {
  if (!setting.configured) return 'Not set';
  if (setting.secret) return setting.hint || '••••';
  if (setting.kind === 'bool') return setting.value ? 'On' : 'Off';
  return String(setting.value ?? '');
}

function SettingRow({ setting }: { setting: PlatformSetting }) {
  const save = useSaveSetting();
  const reset = useResetSetting();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [error, setError] = React.useState('');
  // Every change (or reset) is confirmed first: these settings affect the whole platform.
  const [confirm, setConfirm] = React.useState<{ kind: 'save'; value: string | number | boolean } | { kind: 'reset' } | null>(null);

  const begin = () => {
    // Secrets are never sent to the browser, so they always start empty.
    setDraft(setting.secret || setting.value == null ? '' : String(setting.value));
    setError('');
    setEditing(true);
  };

  const submit = async (value: string | number | boolean) => {
    setError('');
    try {
      await save.mutateAsync({ key: setting.key, value });
      setEditing(false);
      setDraft('');
      toast.success(`${setting.label} saved. It is live now.`);
    } catch (err) {
      setError((err as { message?: string })?.message || 'Could not save');
    }
  };

  const isBool = setting.kind === 'bool';
  const isChoice = setting.kind === 'choice';

  return (
    <div className="space-y-2 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm font-medium">{setting.label}</Label>
            {setting.secret && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Secret" />}
            <SourcePill setting={setting} />
          </div>
          {setting.help && <p className="mt-0.5 max-w-prose text-xs text-muted-foreground">{setting.help}</p>}
        </div>

        {!editing && (
          <div className="flex items-center gap-3">
            {isBool ? (
              <Switch
                checked={!!setting.value}
                disabled={save.isPending}
                onCheckedChange={(v) => setConfirm({ kind: 'save', value: v })}
                aria-label={setting.label}
              />
            ) : (
              <>
                <span className={cn('font-mono text-sm', !setting.configured && 'text-muted-foreground')}>
                  {currentText(setting)}
                </span>
                <Button size="sm" variant="outline" onClick={begin}>
                  {setting.configured ? 'Change' : 'Set'}
                </Button>
              </>
            )}
            {setting.source === 'dashboard' && (
              <Button
                size="sm"
                variant="ghost"
                disabled={reset.isPending}
                onClick={() => setConfirm({ kind: 'reset' })}
                title="Stop overriding and use the server file value"
              >
                Reset
              </Button>
            )}
          </div>
        )}
      </div>

      {editing && (
        <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
          {isChoice ? (
            <Select value={draft || undefined} onValueChange={setDraft}>
              <SelectTrigger className="h-11 sm:max-w-xs">
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                {setting.choices.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              autoFocus
              className="h-11 font-mono"
              type={setting.secret ? 'password' : setting.kind === 'int' ? 'number' : 'text'}
              autoComplete="off"
              spellCheck={false}
              placeholder={setting.secret ? 'Paste the new value' : setting.placeholder}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && draft.trim()) setConfirm({ kind: 'save', value: draft.trim() });
              }}
            />
          )}
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              size="sm"
              isLoading={save.isPending}
              disabled={!draft.trim() || save.isPending}
              onClick={() => setConfirm({ kind: 'save', value: draft.trim() })}
            >
              Save
            </Button>
            <Button size="sm" variant="outline" disabled={save.isPending} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
          {setting.secret && (
            <p className="text-xs text-muted-foreground">
              Stored encrypted. Once saved it is never shown again, only its last four characters.
            </p>
          )}
        </div>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === 'reset' ? `Reset ${setting.label}?` : `Change ${setting.label}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This takes effect immediately for the whole platform: every landlord, caretaker and tenant. A wrong
              value can stop rent payments, texts or emails right away.
              {confirm?.kind === 'reset' && ' The value from the server file will be used again.'}
              {' '}Use the Test button afterwards to check it works.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const pending = confirm;
                setConfirm(null);
                if (pending?.kind === 'save') void submit(pending.value);
                if (pending?.kind === 'reset') reset.mutate(setting.key);
              }}
            >
              {confirm?.kind === 'reset' ? 'Reset' : 'Save change'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GroupCard({ group }: { group: SettingGroup }) {
  const test = useConnectionTest();
  const [result, setResult] = React.useState<ConnectionTestResult | null>(null);
  const config = TESTS[group.id];

  const runTest = async () => {
    setResult(null);
    try {
      setResult(await test.mutateAsync(config!.kind));
    } catch (err) {
      setResult({ ok: false, detail: (err as { message?: string })?.message || 'The check could not run.' });
    }
  };

  return (
    <section className="rounded-2xl border bg-background shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{group.title}</h2>
          <p className="text-xs text-muted-foreground">{group.description}</p>
        </div>
        {config && (
          <div className="text-right">
            <Button size="sm" variant="outline" onClick={() => void runTest()} isLoading={test.isPending} leftIcon={<Send className="h-3.5 w-3.5" />}>
              {config.label}
            </Button>
            {config.note && <p className="mt-1 text-[11px] text-muted-foreground">{config.note}</p>}
          </div>
        )}
      </div>

      {result && (
        <div
          role="status"
          className={cn(
            'mx-5 mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm',
            result.ok ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-destructive/30 bg-destructive/10',
          )}
        >
          {result.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          )}
          <div>
            <p className="text-foreground">{result.detail}</p>
            {result.warning && (
              <p className="mt-1 flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {result.warning}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="divide-y px-5">
        {group.settings.map((s) => (
          <SettingRow key={s.key} setting={s} />
        ))}
      </div>
    </section>
  );
}

function formatLeft(seconds: number) {
  const m = Math.floor(seconds / 60);
  const sec = String(seconds % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

function UnlockedIntegrations({ secondsLeft }: { secondsLeft: number }) {
  const qc = useQueryClient();
  const lock = useLock();
  const { data: groups = [], isLoading, error } = usePlatformSettings();
  const [left, setLeft] = React.useState(secondsLeft);

  React.useEffect(() => setLeft(secondsLeft), [secondsLeft]);

  // Count down; when the unlock runs out, ask the server so the password gate returns.
  React.useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          qc.invalidateQueries({ queryKey: ['platform-settings', 'unlock'] });
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [qc]);

  // The server can lock earlier than the clock says (e.g. the cache restarted).
  React.useEffect(() => {
    if ((error as { error?: string } | null)?.error === 'reauth_required') {
      qc.invalidateQueries({ queryKey: ['platform-settings', 'unlock'] });
    }
  }, [error, qc]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background px-4 py-3 shadow-sm">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LockOpen className="h-4 w-4 text-primary" />
          Unlocked. Locks again in <span className="font-mono font-medium text-foreground">{formatLeft(left)}</span>
        </p>
        <Button size="sm" variant="outline" onClick={() => lock.mutate()} isLoading={lock.isPending} leftIcon={<Lock className="h-3.5 w-3.5" />}>
          Lock now
        </Button>
      </div>

      <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div className="text-sm">
          <p className="font-semibold text-foreground">Be careful: changes here affect the entire system.</p>
          <p className="mt-0.5 text-muted-foreground">
            They go live immediately for every landlord, caretaker and tenant. A wrong key or address can stop rent
            payments, text messages or emails straight away. Double-check each value, run the Test button after every
            change, and keep the old value safe until the new one is proven to work.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Keys are stored encrypted and are never shown again.</span>{' '}
          A value set here overrides the server file; Reset goes back to it. Every change is recorded in the audit log.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => <GroupCard key={g.id} group={g} />)}
        </div>
      )}

      <SocialLinksSection />

      <TaxRatesSection />

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <KeyRound className="h-3.5 w-3.5" />
        Database, hosting and security secrets stay on the server and cannot be changed from here.
      </p>
    </div>
  );
}

export function IntegrationsView() {
  const { data: unlock, isLoading } = useUnlockStatus();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="The keys RumiaRent uses for payments, texts and email, and the public site's social links."
      />
      {isLoading ? (
        <div className="skeleton mx-auto h-64 max-w-md rounded-2xl" />
      ) : unlock?.unlocked ? (
        <UnlockedIntegrations secondsLeft={unlock.seconds_left} />
      ) : (
        <PasswordGate />
      )}
    </div>
  );
}
