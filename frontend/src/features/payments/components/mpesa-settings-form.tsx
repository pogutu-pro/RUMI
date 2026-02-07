'use client';

import * as React from 'react';
import { Loader2, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreateMpesaConfig } from '../hooks/use-payments';
import { MpesaConfig } from '../types';
import { cn } from '@/lib/utils';

interface MpesaSettingsFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function MpesaSettingsForm({ onSuccess, onCancel }: MpesaSettingsFormProps) {
  const [formData, setFormData] = React.useState({
    business_name: '',
    mpesa_number: '',
    payment_type: 'paybill' as 'paybill',
    consumer_key: '',
    consumer_secret: '',
    passkey: '',
  });

  const { mutate: createConfig, isPending } = useCreateMpesaConfig();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name || !formData.mpesa_number || !formData.consumer_key || !formData.consumer_secret || !formData.passkey) {
      toast.error('Please fill in all required API credentials');
      return;
    }

    createConfig(formData as any, {
      onSuccess: () => {
        toast.success('M-Pesa integration configured successfully');
        onSuccess();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Configuration Details</h3>
          <p className="text-slate-500 font-medium text-sm">Enter the details for your M-Pesa Till or Paybill number below.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">Business / Display Name <span className="text-red-500">*</span></Label>
          <Input 
            placeholder="e.g. RUMI Suites Block A" 
            value={formData.business_name}
            onChange={e => setFormData({...formData, business_name: e.target.value})}
            className="h-12 md:h-14 rounded-xl text-base bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500"
          />
          <p className="text-xs text-slate-500 font-medium pl-1">This name will be shown to tenants when making payments.</p>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">
             Paybill / Business Number <span className="text-red-500">*</span>
          </Label>
          <Input 
            placeholder="e.g. 522522"
            value={formData.mpesa_number}
            onChange={e => setFormData({...formData, mpesa_number: e.target.value})}
            className="h-12 md:h-14 rounded-xl text-base bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono tracking-wide"
          />
        </div>

        <div className="md:col-span-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl space-y-2">
          <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Direct Fund Isolation (No-Escrow)</h4>
          <p className="text-xs text-amber-700 dark:text-amber-500">
            To ensure funds land directly in your account without platform escrow, please provide your Safaricom Daraja API credentials. 
            Rumia uses these to trigger STK pushes on your behalf.
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">Consumer Key <span className="text-red-500">*</span></Label>
          <Input 
            placeholder="Daraja App Consumer Key" 
            value={formData.consumer_key}
            onChange={e => setFormData({...formData, consumer_key: e.target.value})}
            className="h-12 md:h-14 rounded-xl text-base bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">Consumer Secret <span className="text-red-500">*</span></Label>
          <Input 
            type="password"
            placeholder="Daraja App Consumer Secret" 
            value={formData.consumer_secret}
            onChange={e => setFormData({...formData, consumer_secret: e.target.value})}
            className="h-12 md:h-14 rounded-xl text-base bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">Lipa Na M-Pesa Passkey <span className="text-red-500">*</span></Label>
          <Input 
            type="password"
            placeholder="LNP Passkey" 
            value={formData.passkey}
            onChange={e => setFormData({...formData, passkey: e.target.value})}
            className="h-12 md:h-14 rounded-xl text-base bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      <div className="pt-6 flex flex-col-reverse md:flex-row items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800 mt-4">
        <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            className="w-full md:w-auto h-12 px-8 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
            Cancel
        </Button>
        <Button 
            type="submit" 
            disabled={isPending}
            className="w-full md:w-auto h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20"
        >
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" /> Save Configuration
                </>
            )}
        </Button>
      </div>
    </form>
  );
}
