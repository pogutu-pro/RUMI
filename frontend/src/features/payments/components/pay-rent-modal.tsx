'use client';

import * as React from 'react';
import {
  CheckCircle2,
  Loader2,
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
import { useInitiatePayment } from '../hooks/use-payments';

interface PayRentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | number;
  amount: number;
  hostelName?: string;
}

type PaymentStep = 'method' | 'success';

export function PayRentModal({ isOpen, onClose, bookingId, amount, hostelName }: PayRentModalProps) {
  const [step, setStep] = React.useState<PaymentStep>('method');
  const [transactionId, setTransactionId] = React.useState<string | number | null>(null);
  const [editableAmount, setEditableAmount] = React.useState(amount.toString());

  const { mutate: initiatePayment, isPending: isInitializing } = useInitiatePayment();

  React.useEffect(() => {
    setEditableAmount(amount.toString());
  }, [amount]);

  const handlePaystackPay = () => {
    const finalAmount = parseFloat(editableAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error('Invalid amount.');
      return;
    }

    initiatePayment(
      {
        bookingId,
        method: 'paystack',
        amount: finalAmount,
      },
      {
        onSuccess: (data: any) => {
          setTransactionId(data?.transactionId || null);
          setStep('success');
          toast.success('Payment initiated successfully!');
        },
        onError: (error: any) => {
          toast.error(error.message || 'Payment failed. Please try again.');
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-2 border-border shadow-none bg-background rounded-none">
        <div className="h-2 w-full bg-muted">
          <div
            className="h-full bg-primary"
            style={{ width: step === 'method' ? '20%' : '100%' }}
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

              <Button
                className="w-full h-16 rounded-none font-black text-base"
                onClick={handlePaystackPay}
                disabled={isInitializing}
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    PROCESSING...
                  </>
                ) : (
                  'PAY WITH PAYSTACK'
                )}
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
              {transactionId && (
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
              )}
              <Button className="w-full h-12 rounded-none font-black uppercase" onClick={onClose}>DONE</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
