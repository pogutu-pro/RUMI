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
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name || !formData.mpesa_number) {
      toast.error('Please fill in Business Name and M-Pesa Number');
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
    <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
      <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="h-6 w-6 text-emerald-500" />
            Payment Setup
          </h3>
          <p className="text-slate-500 font-medium text-base">Enter where you want students to send their money.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-4">
          <Label className="text-lg font-bold text-slate-700 dark:text-slate-300">What name is registered on your M-Pesa? <span className="text-red-500">*</span></Label>
          <Input 
            placeholder="e.g. JANE DOE HOSTELS" 
            value={formData.business_name}
            onChange={e => setFormData({...formData, business_name: e.target.value})}
            className="h-16 rounded-2xl text-xl font-bold bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500"
          />
          <p className="text-sm text-slate-500 font-medium pl-1 italic">Students will see this name when they pay.</p>
        </div>

        <div className="space-y-4">
          <Label className="text-lg font-bold text-slate-700 dark:text-slate-300">
             Enter your Paybill or Till Number <span className="text-red-500">*</span>
          </Label>
          <Input 
            placeholder="e.g. 522522"
            value={formData.mpesa_number}
            onChange={e => setFormData({...formData, mpesa_number: e.target.value})}
            className="h-16 rounded-2xl text-2xl font-black bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono tracking-widest text-emerald-600"
          />
          <p className="text-sm text-slate-500 font-medium pl-1 italic">Double check this number! It must be 100% correct.</p>
        </div>

        <div className="pt-4">
            <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 h-10 px-4 rounded-xl text-sm"
            >
                {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings (STK Push)"}
            </Button>
        </div>

        {showAdvanced && (
           <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl space-y-2">
                    <h4 className="text-base font-bold text-amber-800 dark:text-amber-400">Direct Fund Isolation (No-Escrow)</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-500 leading-relaxed font-medium">
                        To enable automated "STK push" prompts on student phones, provide your Safaricom Daraja API credentials. 
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label className="font-bold text-slate-700 dark:text-slate-300">Consumer Key</Label>
                        <Input 
                            placeholder="Daraja App Consumer Key" 
                            value={formData.consumer_key}
                            onChange={e => setFormData({...formData, consumer_key: e.target.value})}
                            className="h-14 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="font-bold text-slate-700 dark:text-slate-300">Consumer Secret</Label>
                        <Input 
                            type="password"
                            placeholder="Daraja App Consumer Secret" 
                            value={formData.consumer_secret}
                            onChange={e => setFormData({...formData, consumer_secret: e.target.value})}
                            className="h-14 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="font-bold text-slate-700 dark:text-slate-300">Lipa Na M-Pesa Passkey</Label>
                        <Input 
                            type="password"
                            placeholder="LNP Passkey" 
                            value={formData.passkey}
                            onChange={e => setFormData({...formData, passkey: e.target.value})}
                            className="h-14 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                        />
                    </div>
                </div>
           </div>
        )}
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
