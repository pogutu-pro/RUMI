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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useInitiatePayment } from '../../hooks/use-payments';
import { StatusPill } from '@/components/ui/status-pill';

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | number;
  amount: number;
  hostelName?: string;
  description?: string;
}

type PaymentStep = 'confirm' | 'success';

export function PaymentDrawer({
  isOpen,
  onClose,
  bookingId,
  amount,
  hostelName,
  description = "Rent Payment"
}: PaymentDrawerProps) {
  const [step, setStep] = React.useState<PaymentStep>('confirm');
  const [transactionId, setTransactionId] = React.useState<string | number | null>(null);
  const [editableAmount, setEditableAmount] = React.useState(amount.toString());

  const { mutate: initiatePayment, isPending: isInitializing } = useInitiatePayment();

  React.useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setEditableAmount(amount.toString());
    }
  }, [isOpen, amount]);

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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-md">

          <DrawerHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DrawerTitle>SafePay Request</DrawerTitle>
                <DrawerDescription>{hostelName || 'Secure Payment Link'}</DrawerDescription>
              </div>
              <StatusPill status={step === 'success' ? 'success' : 'default'} className="uppercase text-[10px]">
                {step === 'success' ? 'Paid' : 'Secure'}
              </StatusPill>
            </div>
          </DrawerHeader>

          <div className="p-4 space-y-6">

            {step === 'confirm' && (
              <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-xl border border-border/50 text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      KES {parseFloat(editableAmount).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Includes all service fees</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pay-amount" className="text-xs font-semibold uppercase text-muted-foreground">Amount to Pay</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/60">KES</span>
                      <Input
                        id="pay-amount"
                        type="number"
                        value={editableAmount}
                        onChange={(e) => setEditableAmount(e.target.value)}
                        className="pl-12 h-12 text-lg font-medium"
                      />
                    </div>
                  </div>
                  <Button className="w-full h-12 text-base font-semibold" onClick={handlePaystackPay} disabled={isInitializing}>
                    {isInitializing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Pay with Paystack'
                    )}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    Encrypted 256-bit transaction
                  </p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="py-8 text-center space-y-6">
                <div className="mx-auto h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-emerald-900">Payment Successful!</h3>
                  <p className="text-emerald-700">Receipt #{transactionId || 'PENDING'}</p>
                </div>
                <div className="border rounded-lg p-4 bg-gray-50 text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-semibold">{formatCurrency(parseFloat(editableAmount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  {transactionId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono">{transactionId}</span>
                    </div>
                  )}
                </div>
                <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700" onClick={onClose}>
                  Done
                </Button>
              </div>
            )}

          </div>

          <DrawerFooter>
            {step !== 'success' && (
              <DrawerClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DrawerClose>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
