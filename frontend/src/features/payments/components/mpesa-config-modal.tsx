'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Smartphone, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Loader2,
  Settings2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useMpesaConfigs, useCreateMpesaConfig } from '../hooks/use-payments';
import { cn } from '@/lib/utils';
import { MpesaConfig } from '../types';

interface MpesaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MpesaConfigModal({ isOpen, onClose }: MpesaConfigModalProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [formData, setFormData] = React.useState({
    business_name: '',
    mpesa_number: '',
    payment_type: 'till_number' as MpesaConfig['payment_type'],
  });

  const { data: configs, isLoading } = useMpesaConfigs();
  const { mutate: createConfig, isPending: isCreating } = useCreateMpesaConfig();

  const handleCreate = () => {
    if (!formData.business_name || !formData.mpesa_number) {
      toast.error('Please fill in all fields');
      return;
    }

    createConfig(formData, {
      onSuccess: () => {
        setIsAdding(false);
        setFormData({ business_name: '', mpesa_number: '', payment_type: 'till_number' });
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-950 dark:bg-slate-950 p-6 text-white relative">
          <div className="absolute top-0 right-0 p-8 bg-emerald-500/20 blur-3xl rounded-full" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <Settings2 className="h-6 w-6 text-emerald-500" />
              M-Pesa Settings
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Manage your property payment receiving methods
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50">
          <AnimatePresence mode="wait">
            {!isAdding ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Configured Methods</h3>
                  <Button 
                    size="sm" 
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs"
                    onClick={() => setIsAdding(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add New
                  </Button>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-20 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />)}
                  </div>
                ) : configs && configs.length > 0 ? (
                  <div className="space-y-3">
                    {configs.map((config) => (
                      <div 
                        key={config.id}
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:border-emerald-500/50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center">
                            <Smartphone className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{config.business_name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{config.mpesa_number}</span>
                              <Badge variant="secondary" className="text-[9px] h-4 px-1 uppercase">{config.payment_type.replace('_', ' ')}</Badge>
                            </div>
                          </div>
                        </div>
                        {config.is_default && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Default</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-sm text-slate-500 mb-4">No M-Pesa configurations found</p>
                    <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
                      Set up your first method
                    </Button>
                  </div>
                )}

                <div className="p-4 bg-muted/50 rounded-xl border border-border flex gap-3">
                  <Info className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    M-Pesa payments are automatically verified. Ensure your Business Shortcode or Till Number is correct to avoid payment delays.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5"
              >
                <div className="space-y-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="space-y-2">
                    <Label>Business / Display Name</Label>
                    <Input 
                      placeholder="e.g. RUMI Suites" 
                      value={formData.business_name}
                      onChange={e => setFormData({...formData, business_name: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select 
                        value={formData.payment_type}
                        onValueChange={(val: any) => setFormData({...formData, payment_type: val})}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="till_number">Till Number</SelectItem>
                          <SelectItem value="paybill_number">Paybill</SelectItem>
                          <SelectItem value="pochi_la_biashara">Pochi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>M-Pesa Number/Code</Label>
                      <Input 
                        placeholder="e.g. 174379" 
                        value={formData.mpesa_number}
                        onChange={e => setFormData({...formData, mpesa_number: e.target.value})}
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1 h-12 rounded-xl" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="flex-2 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                    onClick={handleCreate}
                    disabled={isCreating}
                  >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Configuration'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
