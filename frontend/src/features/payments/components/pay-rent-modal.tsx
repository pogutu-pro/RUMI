'use client';

import * as React from 'react';
import { 
  X, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  ChevronRight,
  Info,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useInitializeMpesaPayment, useMpesaPaymentStatus } from '../hooks/use-payments';
import { cn } from '@/lib/utils';
import { axiosInstance as axios } from '@/lib/api/client';

interface PayRentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | number;
  amount: number;
  hostelName?: string;
}

type PaymentStep = 'method' | 'phone' | 'stk_pending' | 'success' | 'instructions';

export function PayRentModal({ isOpen, onClose, bookingId, amount, hostelName }: PayRentModalProps) {
  const [step, setStep] = React.useState<PaymentStep>('method');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [transactionId, setTransactionId] = React.useState<string | number | null>(null);
  const [checkoutId, setCheckoutId] = React.useState<string | null>(null);
  const [c2bInstructions, setC2bInstructions] = React.useState<any>(null);

  const { mutate: initializeMpesa, isPending: isInitializing } = useInitializeMpesaPayment();
  const [editableAmount, setEditableAmount] = React.useState(amount.toString());
  
  React.useEffect(() => {
    setEditableAmount(amount.toString());
  }, [amount]);

  const { data: statusData } = useMpesaPaymentStatus(
    { transaction_id: transactionId || undefined, checkout_request_id: checkoutId || undefined },
    { enabled: step === 'stk_pending' }
  );

  React.useEffect(() => {
    if (statusData?.status === 'success') {
      setStep('success');
      toast.success('Payment completed successfully!');
    } else if (statusData?.status === 'failed' || statusData?.status === 'cancelled') {
      setStep('instructions');
      toast.error('STK push failed or was cancelled. Please use the offline instructions.');
    }
  }, [statusData]);

  const handleMpesaInit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid M-Pesa phone number');
      return;
    }

    let actualBookingId = bookingId;
    
    if (bookingId === 'current') {
      try {
        const dashboardResponse = await axios.get('/accounts/dashboard/');
        if (dashboardResponse.data?.hostelInfo?.booking_id) {
          actualBookingId = dashboardResponse.data.hostelInfo.booking_id;
        } else {
          toast.error('No active booking found.');
          return;
        }
      } catch (error) {
        toast.error('Unable to fetch booking information.');
        return;
      }
    }

    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
    if (formattedPhone.startsWith('7')) formattedPhone = '254' + formattedPhone;
    if (formattedPhone.startsWith('1')) formattedPhone = '254' + formattedPhone;
    
    if (formattedPhone.length !== 12) {
      toast.error('Invalid phone number format.');
      return;
    }

    const finalAmount = parseFloat(editableAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error('Invalid amount.');
      return;
    }

    initializeMpesa(
      {
        booking_id: actualBookingId,
        payment_type: 'initial',
        payment_method: 'stk_push',
        phone_number: formattedPhone,
      },
      {
        onSuccess: (data) => {
          setTransactionId(data.transaction_id);
          setCheckoutId(data.checkout_request_id);
          setC2bInstructions(data.c2b_alternative);
          setStep('stk_pending');
        },
        onError: (error: any) => {
          toast.error(error.message || 'STK Push failed.');
          setStep('instructions');
        }
      }
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-2 border-border shadow-none bg-background rounded-none">
        <div className="h-2 w-full bg-muted">
          <div 
            className="h-full bg-primary"
            style={{ 
              width: step === 'method' ? '20%' : 
                     step === 'phone' ? '40%' : 
                     step === 'stk_pending' ? '70%' : '100%' 
            }}
          />
        </div>

        <div className="p-6">
          {step === 'method' && (
            <div className="space-y-6">
              <DialogHeader className="p-0">
                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  PAYMENT
                </DialogTitle>
                <DialogDescription className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                  Secure transaction for {hostelName || 'Booking'}
                </DialogDescription>
              </DialogHeader>

              <div className="bg-muted/10 border-2 border-border p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Due Balance</p>
                    <p className="text-xl font-black text-foreground/40 line-through">
                      <span className="text-xs font-black mr-1">KES</span>
                      {amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="space-y-2 bg-background p-4 border-2 border-border">
                  <Label htmlFor="pay-amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount to Pay</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/60">KES</span>
                    <Input
                      id="pay-amount"
                      type="number"
                      value={editableAmount}
                      onChange={(e) => setEditableAmount(e.target.value)}
                      className="pl-12 h-12 text-2xl font-black bg-transparent border-none focus-visible:ring-0 p-0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-1">Method</Label>
                <Button 
                  variant="outline" 
                  className="w-full h-16 justify-between border-2 rounded-none hover:bg-muted"
                  onClick={() => setStep('phone')}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center font-black">M</div>
                    <div className="text-left">
                      <p className="font-black">M-PESA STK PUSH</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase">Instant Prompt</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {step === 'phone' && (
            <div className="space-y-6">
              <DialogHeader className="p-0">
                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                  <Smartphone className="h-6 w-6 text-primary" />
                  PHONE NUMBER
                </DialogTitle>
                <DialogDescription className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                  M-Pesa registered number
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="07XX XXX XXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12 text-lg font-black border-2 rounded-none focus-visible:ring-primary"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 h-12 rounded-none font-black" onClick={() => setStep('method')}>BACK</Button>
                  <Button 
                    className="flex-[2] h-12 rounded-none font-black"
                    onClick={handleMpesaInit}
                    disabled={isInitializing}
                  >
                    {isInitializing ? 'INITIALIZING...' : 'CONFIRM & PAY'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'stk_pending' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
              <div className="relative">
                <div className="h-24 w-24 border-4 border-primary/20 border-t-primary animate-spin rounded-none" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Smartphone className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase">Waiting for PIN</h3>
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wide max-w-[280px]">
                  Check your phone and enter M-Pesa PIN
                </p>
              </div>
              <div className="w-full bg-muted/10 border-2 border-dashed border-border p-4">
                <p className="text-[10px] text-muted-foreground font-black uppercase">
                  No prompt? Switch to offline instructions below.
                </p>
              </div>
              <Button variant="link" className="text-xs font-black uppercase" onClick={() => setStep('instructions')}>
                Offline Instructions
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
              <div className="h-20 w-20 bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase">Success</h3>
                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">Transaction processed</p>
              </div>
              <div className="w-full bg-muted/10 border-2 border-border p-5 space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground font-black uppercase tracking-widest">Ref</span>
                  <span className="font-mono font-black text-foreground bg-background px-2 py-1 border-2 border-border">{transactionId}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground font-black uppercase tracking-widest">Status</span>
                  <Badge className="bg-emerald-600 text-white rounded-none font-black px-2 py-1">COMPLETED</Badge>
                </div>
              </div>
              <Button className="w-full h-12 rounded-none font-black uppercase" onClick={onClose}>DONE</Button>
            </div>
          )}

          {step === 'instructions' && (
            <div className="space-y-6">
              <DialogHeader className="p-0">
                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                  OFFLINE
                </DialogTitle>
                <DialogDescription className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                  Manual M-Pesa payment
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                {[
                  { label: 'Paybill', value: c2bInstructions?.business_number || '174379' },
                  { label: 'Account', value: c2bInstructions?.reference || 'RUMI-REF' },
                ].map((item, i) => (
                  <div key={i} className="bg-muted/10 p-4 border-2 border-border flex justify-between items-center">
                    <div>
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{item.label}</p>
                      <p className="font-black text-xl font-mono">{item.value}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.value, item.label)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="bg-muted/10 p-4 border-2 border-border flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Amount</p>
                    <p className="text-xl font-black">KES {amount.toLocaleString()}</p>
                  </div>
                </div>
                <Button className="w-full h-12 rounded-none font-black uppercase" onClick={onClose}>I HAVE PAID</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
