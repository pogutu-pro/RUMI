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
    payment_type: 'till_number' as MpesaConfig['payment_type'],
  });

  const { mutate: createConfig, isPending } = useCreateMpesaConfig();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name || !formData.mpesa_number) {
      toast.error('Please fill in all fields');
      return;
    }

    createConfig(formData, {
      onSuccess: () => {
        toast.success('Payment method added successfully');
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
            <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">Account Type <span className="text-red-500">*</span></Label>
            <Select 
            value={formData.payment_type}
            onValueChange={(val: any) => setFormData({...formData, payment_type: val})}
            >
            <SelectTrigger className="h-12 md:h-14 rounded-xl text-base bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-emerald-500">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="till_number" className="py-3 text-base font-medium">Buy Goods / Till Number</SelectItem>
                <SelectItem value="paybill_number" className="py-3 text-base font-medium">Paybill Number</SelectItem>
                <SelectItem value="pochi_la_biashara" className="py-3 text-base font-medium">Pochi la Biashara</SelectItem>
            </SelectContent>
            </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">
             {formData.payment_type === 'paybill_number' ? 'Business Number' : 'Till / Phone Number'} <span className="text-red-500">*</span>
          </Label>
          <Input 
            placeholder={formData.payment_type === 'paybill_number' ? 'e.g. 522522' : 'e.g. 174379'}
            value={formData.mpesa_number}
            onChange={e => setFormData({...formData, mpesa_number: e.target.value})}
            className="h-12 md:h-14 rounded-xl text-base bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono tracking-wide"
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
