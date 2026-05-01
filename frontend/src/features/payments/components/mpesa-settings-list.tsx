'use client';

import * as React from 'react';
import { Smartphone, Trash2, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useMpesaConfigs } from '../hooks/use-payments';
import { MpesaConfig } from '../types';
import { cn } from '@/lib/utils';

interface MpesaSettingsListProps {
  onEdit: (config: MpesaConfig) => void;
  hostelId?: string;
}

export function MpesaSettingsList({ onEdit, hostelId }: MpesaSettingsListProps) {
  const { data: allConfigs, isLoading } = useMpesaConfigs();

  const configs = React.useMemo(() => {
    if (!allConfigs) return [];
    if (!hostelId) return allConfigs;
    return allConfigs.filter(c => c.hostel_id === hostelId);
  }, [allConfigs, hostelId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!configs || configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-muted/30 border-2 border-dashed border-border">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Smartphone className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">No Payment Methods Configured</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          You haven't added any M-Pesa payment details yet. Add one to start tracking payments automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {configs.map((config) => (
        <div
            key={config.id}
            className="group relative bg-card border border-border p-4 shadow-sm transition-colors hover:border-primary/50"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  config.is_default ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              )}>
                <Smartphone className="h-6 w-6" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-foreground text-lg">{config.business_name}</h3>
                  {config.is_default && (
                    <Badge variant="secondary" className="bg-success/10 text-success border-none">Default</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                   <div className="flex items-center gap-1.5 bg-muted py-1 px-2.5 rounded-lg border border-border">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{config.payment_type.replace('_', ' ')}</span>
                   </div>
                   <span className="font-mono font-bold tracking-wide text-foreground bg-card py-1 px-2 rounded-md border">{config.mpesa_number}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
                {/* 
                  TODO: Add functionality for edit/delete if API supports it later.
                  For now, we might just be viewing. But the design should show readiness.
                 */}
                 {/* <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    <Edit2 className="h-4 w-4" />
                 </Button> */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
