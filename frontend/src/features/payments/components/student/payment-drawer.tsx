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
  ShieldCheck,
  Wallet,
  ArrowRight
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useInitializeMpesaPayment, useMpesaPaymentStatus } from '../../hooks/use-payments';
import { cn } from '@/lib/utils/cn';
import { axiosInstance as axios } from '@/lib/api/client';
import { StatusPill } from '@/components/ui/status-pill';

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | number;
  amount: number;
  hostelName?: string;
  description?: string;
}

type PaymentStep = 'confirm' | 'phone' | 'stk_pending' | 'success' | 'instructions';

export function PaymentDrawer({ 
  isOpen, 
  onClose, 
  bookingId, 
  amount, 
  hostelName,
  description = "Rent Payment"
}: PaymentDrawerProps) {
  const [step, setStep] = React.useState<PaymentStep>('confirm');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [transactionId, setTransactionId] = React.useState<string | number | null>(null);
  const [checkoutId, setCheckoutId] = React.useState<string | null>(null);
  const [c2bInstructions, setC2bInstructions] = React.useState<any>(null);
  const [editableAmount, setEditableAmount] = React.useState(amount.toString());

  const { mutate: initializeMpesa, isPending: isInitializing } = useInitializeMpesaPayment();

  // Reset state when drawer opens
  React.useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setEditableAmount(amount.toString());
      // Ideally fetch user phone here if available
    }
  }, [isOpen, amount]);

  const { data: statusData } = useMpesaPaymentStatus(
    { transaction_id: transactionId || undefined, checkout_request_id: checkoutId || undefined },
    { enabled: step === 'stk_pending', refetchInterval: 3000 }
  );

  React.useEffect(() => {
    if (statusData?.status === 'success') {
      setStep('success');
      toast.success('Payment completed successfully!');
    } else if (statusData?.status === 'failed' || statusData?.status === 'cancelled') {
        // Don't auto-switch to instructions immediately, let user see failure message
       toast.error('Payment failed or cancelled.');
    }
  }, [statusData]);

  // Fallback timer for STK push
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'stk_pending') {
      timer = setTimeout(() => {
        // If still pending after 15s, show option to use Paybill
        toast('Taking too long? Use manual Paybill instructions.', {
            action: {
                label: 'Show Instructions',
                onClick: () => setStep('instructions')
            },
            duration: 8000
        });
      }, 15000);
    }
    return () => clearTimeout(timer);
  }, [step]);

  const handleMpesaInit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid M-Pesa phone number');
      return;
    }

    let actualBookingId = bookingId;
    
    // Resolve "current" booking ID if needed
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
        payment_type: 'initial', // Should be dynamic based on context
        payment_method: 'stk_push',
        phone_number: formattedPhone,
        amount: finalAmount // Ensure backend accepts override if allowed
      },
      {
        onSuccess: (data) => {
          setTransactionId(data.transaction_id);
          setCheckoutId(data.checkout_request_id);
          setC2bInstructions(data.c2b_alternative);
          setStep('stk_pending');
        },
        onError: (error: any) => {
          toast.error(error.message || 'STK Push failed. Using manual instructions.');
          setStep('instructions');
        }
      }
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-md">
          
          {/* Header Section */}
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

          {/* Content Area */}
          <div className="p-4 space-y-6">
            
            {/* Step 1: Confirmation */}
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
                            <Label htmlFor="phone" className="text-xs font-semibold uppercase text-muted-foreground">M-Pesa Number</Label>
                            <Input 
                                id="phone" 
                                placeholder="07XX XXX XXX" 
                                className="h-12 text-lg font-medium" 
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                autoFocus
                            />
                         </div>
                         <Button className="w-full h-12 text-base font-semibold" onClick={() => setStep('phone')}>
                            Pay Securely
                         </Button>
                         <p className="text-[10px] text-center text-muted-foreground">
                            Encrypted 256-bit transaction
                         </p>
                    </div>
                </div>
            )}
            
            {/* Intermediate: Phone Confirm (Redundant if merged above, but keeping for flow) */}
            {step === 'phone' && (
                 <div className="space-y-6 py-4">
                    <div className="text-center space-y-2">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Smartphone className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">Confirm Payment</h3>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                            Sending STK push of <strong>KES {parseFloat(editableAmount).toLocaleString()}</strong> to <strong>{phoneNumber}</strong>
                        </p>
                    </div>
                    <div className="grid gap-3">
                         <Button className="w-full h-12" onClick={handleMpesaInit} disabled={isInitializing}>
                            {isInitializing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending Request...
                                </>
                            ) : (
                                "Confirm & Pay"
                            )}
                         </Button>
                         <Button variant="ghost" className="w-full" onClick={() => setStep('confirm')} disabled={isInitializing}>
                            Change Number
                         </Button>
                    </div>
                 </div>
            )}

            {/* Step 2: Pulse (STK Pending) */}
            {step === 'stk_pending' && (
                <div className="py-8 text-center space-y-6">
                    <div className="relative mx-auto h-24 w-24">
                         <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20 opacity-75"></span>
                         <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary/5 border border-primary/20">
                            <Smartphone className="h-10 w-10 text-primary animate-pulse" />
                         </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Check your phone</h3>
                        <p className="text-sm text-muted-foreground">
                            Enter your M-Pesa PIN to complete the payment of 
                            <br/>
                            <span className="font-semibold text-foreground">KES {parseFloat(editableAmount).toLocaleString()}</span>
                        </p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs text-amber-700 mx-auto max-w-sm">
                        Do not close this window until you receive the M-Pesa confirmation SMS.
                    </div>
                    
                    <div className="pt-4">
                         <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => setStep('instructions')}>
                            Didn't receive a prompt? Pay manually
                         </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Success */}
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
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Transaction ID</span>
                            <span className="font-mono">{statusData?.transaction?.reference || transactionId}</span>
                        </div>
                    </div>
                    <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700" onClick={onClose}>
                        Done
                    </Button>
                </div>
            )}

            {/* Fallback: Instructions */}
            {step === 'instructions' && (
                <div className="space-y-6">
                     <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                        <div className="p-2 bg-white rounded-lg border shadow-sm">
                             <AlertCircle className="h-6 w-6 text-zinc-900" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-zinc-900">Manual Payment Instructions</h4>
                            <p className="text-xs text-zinc-500 mt-1">
                              Use the M-Pesa menu to pay directly to the verified till details below.
                            </p>
                        </div>
                     </div>

                     <div className="grid gap-6">
                         <div className="space-y-1.5">
                             <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Business Number (Paybill)</Label>
                             <div className="flex items-center gap-2 group">
                                 <div className="h-14 flex-1 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center px-4 font-mono text-2xl font-bold tracking-tight text-zinc-900 overflow-hidden">
                                     {c2bInstructions?.business_number || '174379'}
                                 </div>
                                 <Button 
                                    size="icon" 
                                    variant="outline" 
                                    className="h-14 w-14 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                                    onClick={() => copyToClipboard(c2bInstructions?.business_number || '174379', "Paybill")}
                                 >
                                     <Copy className="h-5 w-5" />
                                 </Button>
                             </div>
                         </div>
                         
                         <div className="space-y-1.5">
                             <div className="flex items-center justify-between pl-1">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account Number</Label>
                                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                  Unique to this bed
                                </span>
                             </div>
                             <div className="flex items-center gap-2 group">
                                 <div className="h-14 flex-1 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center px-4 font-mono text-xl font-bold tracking-tight text-zinc-900 truncate">
                                     {c2bInstructions?.reference || 'RUMI-REF'}
                                 </div>
                                 <Button 
                                    size="icon" 
                                    variant="outline" 
                                    className="h-14 w-14 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors" 
                                    onClick={() => copyToClipboard(c2bInstructions?.reference || 'RUMI-REF', "Account Number")}
                                 >
                                     <Copy className="h-5 w-5" />
                                 </Button>
                             </div>
                         </div>

                          <div className="space-y-1.5 pt-2">
                             <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Amount to Pay</Label>
                             <div className="h-14 flex-1 bg-zinc-900 text-white border border-zinc-900 rounded-lg flex items-center justify-between px-4">
                                 <span className="text-sm font-medium text-zinc-400">Total Due</span>
                                 <span className="font-mono text-2xl font-bold tracking-tight">
                                     KES {parseFloat(editableAmount).toLocaleString()}
                                 </span>
                             </div>
                         </div>
                     </div>

                     <Button className="w-full h-14 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/10" onClick={onClose}>
                         I have made the payment
                     </Button>
                </div>
            )}

          </div>
          
          <DrawerFooter>
            {step !== 'success' && step !== 'stk_pending' && (
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
