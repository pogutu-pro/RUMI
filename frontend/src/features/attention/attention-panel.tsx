'use client';

import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { useAttention } from './hooks';

const TONE = {
  urgent: { icon: AlertCircle, ring: 'border-destructive/30 bg-destructive/5', text: 'text-destructive' },
  warning: { icon: Clock, ring: 'border-warning/30 bg-warning/5', text: 'text-warning' },
  info: { icon: Info, ring: 'border-border bg-muted/30', text: 'text-muted-foreground' },
} as const;

/** The landlord's to-do list: what needs doing now, with a direct link to do it. */
export function AttentionPanel() {
  const { data: items = [], isLoading } = useAttention();
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Needs your attention</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Checking…</p>
        ) : items.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> All caught up — nothing needs you right now.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((item) => {
              const tone = TONE[item.tone];
              const Icon = tone.icon;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={cn('group flex h-full gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/60', tone.ring)}
                  >
                    <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', tone.text)} aria-hidden="true" />
                    <span className="flex-1 text-sm">
                      <span className="font-medium">
                        <span className={tone.text}>{item.count}</span> {item.title}
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-muted-foreground sm:line-clamp-none">{item.detail}</span>
                    </span>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
