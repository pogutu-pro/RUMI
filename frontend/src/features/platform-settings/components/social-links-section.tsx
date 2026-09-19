'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SocialIcon } from '@/components/layouts/social-links';
import { useRemoveSocialLink, useSaveSocialLink, useSocialLinksAdmin } from '../hooks/use-platform-settings';
import type { SocialLinkRow } from '../types';

function Row({ row }: { row: SocialLinkRow }) {
  const save = useSaveSocialLink();
  const remove = useRemoveSocialLink();
  const [value, setValue] = React.useState(row.url);
  const [error, setError] = React.useState('');
  const dirty = value.trim() !== row.url;

  // Keep the box in step when the saved link changes from elsewhere.
  React.useEffect(() => setValue(row.url), [row.url]);

  const submit = async () => {
    setError('');
    try {
      await save.mutateAsync({ platform: row.platform, url: value.trim() });
      toast.success(`${row.label} link saved. It shows on the public site now.`);
    } catch (err) {
      setError((err as { message?: string })?.message || 'Could not save that link');
    }
  };

  return (
    <div className="space-y-1.5 py-4">
      <Label htmlFor={`social-${row.platform}`} className="flex items-center gap-2 text-sm font-medium">
        <SocialIcon platform={row.platform} className="h-4 w-4 text-muted-foreground" />
        {row.label}
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={`social-${row.platform}`}
          className="h-11 flex-1 font-mono text-sm"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={row.example}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && dirty && value.trim()) void submit();
          }}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-11"
            isLoading={save.isPending}
            disabled={!dirty || !value.trim() || save.isPending}
            onClick={() => void submit()}
          >
            Save
          </Button>
          {row.url && (
            <Button
              size="sm"
              variant="outline"
              className="h-11"
              disabled={remove.isPending}
              onClick={() => remove.mutate(row.platform)}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

/** Profile links that appear as icons on the public site. Blank platforms are simply not shown. */
export function SocialLinksSection() {
  const { data: rows = [], isLoading } = useSocialLinksAdmin();

  return (
    <section className="rounded-2xl border bg-background shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Globe className="h-4 w-4" /> Social media
        </h2>
        <p className="text-xs text-muted-foreground">
          Paste a profile link and its icon appears in the footer of the public site. Leave a platform empty to hide it.
        </p>
      </div>
      <div className="divide-y px-5">
        {isLoading ? (
          <p className="py-6 text-sm text-muted-foreground">Loading…</p>
        ) : (
          rows.map((row) => <Row key={row.platform} row={row} />)
        )}
      </div>
    </section>
  );
}
