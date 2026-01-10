'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  ChevronRight,
  Info,
  ShieldCheck,
  Wallet,
  Lock,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useInitializeMpesaPayment, useMpesaPaymentStatus } from '@/features/payments/hooks/use-payments';
import { cn } from '@/lib/utils';
import { axiosInstance as axios } from '@/lib/api/client';

type PaymentStep = 'method' | 'phone' | 'stk_pending' | 'success' | 'instructions';

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const bookingIdParam = searchParams.get('bookingId') || 'current';
  const amountParam = parseFloat(searchParams.get('amount') || '15000');
  
  const [step, setStep] = React.useState<PaymentStep>('method');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [transactionId, setTransactionId] = React.useState<string | number | null>(null);
  const [checkoutId, setCheckoutId] = React.useState<string | null>(null);
  const [c2bInstructions, setC2bInstructions] = React.useState<any>(null);
  const [editableAmount, setEditableAmount] = React.useState(amountParam.toString());

  // Define missing variables used in JSX
  const amount = amountParam;
  const hostelName = searchParams.get('hostelName');

  const { mutate: initializeMpesa, isPending: isInitializing } = useInitializeMpesaPayment();

  // Status check query - only enabled when we have IDs and are in pending state
  const { data: statusData, isError: isStatusError } = useMpesaPaymentStatus(
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

    let actualBookingId = bookingIdParam;
    
    // Handle 'current' booking case
    if (bookingIdParam === 'current') {
      try {
        // Try to get the current active booking using the proper API client
        const dashboardResponse = await axios.get('/accounts/dashboard/');
        
        if (dashboardResponse.data?.hostelInfo?.booking_id) {
          actualBookingId = dashboardResponse.data.hostelInfo.booking_id;
        } else {
          toast.error('No active booking found. Please contact support.');
          return;
        }
      } catch (error: any) {
        console.error('Failed to get current booking:', error);
        toast.error('Unable to fetch booking information. Please contact support.');
        return;
      }
    }

    if (!actualBookingId) {
      toast.error('Unable to identify booking. Please contact support.');
      console.error('Missing or invalid bookingId:', bookingIdParam);
      return;
    }

    // Format phone number to 254...
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
    if (formattedPhone.startsWith('7')) formattedPhone = '254' + formattedPhone;
    if (formattedPhone.startsWith('1')) formattedPhone = '254' + formattedPhone;
    
    if (formattedPhone.length !== 12) {
      toast.error('Invalid phone number format. Use 07... or 2547...');
      return;
    }

    const finalAmount = parseFloat(editableAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error('Please enter a valid amount to pay');
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
          // If the error message indicates a backend crash or specific M-Pesa issue
          console.error('M-Pesa Init Error:', error);
          const msg = error.message || 'STK Push failed. Proceeding to manual instructions.';
          toast.error(msg);
          // If it fails to even initialize, we might want to show instructions as a fallback
          setStep('instructions');
        }
      }
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Make Payment</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Secure payment gateway</p>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 w-full bg-muted">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: '0%' }}
            animate={{ 
              width: step === 'method' ? '33%' : 
                     step === 'phone' ? '66%' : '100%' 
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <AnimatePresence mode="wait">
            {step === 'method' && (
              <motion.div
                key="method"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    Complete Payment
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Secure payment for {hostelName || 'your booking'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/30 border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between relative z-10 w-full">
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Due Balance</p>
                        <p className="text-xl font-black text-foreground/60 line-through decoration-emerald-500/30">
                          <span className="text-xs font-black mr-1 text-muted-foreground/40">KES</span>
                          {amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center relative z-10">
                        <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>

                    <div className="space-y-2 relative z-10 bg-background/50 p-4 rounded-xl border border-border/50">
                      <Label htmlFor="pay-amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount to Pay</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/60">KES</span>
                        <Input
                          id="pay-amount"
                          type="number"
                          value={editableAmount}
                          onChange={(e) => setEditableAmount(e.target.value)}
                          className="pl-12 h-12 text-2xl font-black bg-transparent border-none focus-visible:ring-0 p-0"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-1">Select Payment Method</Label>
                  <Button 
                    variant="outline" 
                    className="w-full h-16 justify-between group border-2 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all border-border"
                    onClick={() => setStep('phone')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-600/20">
                        M
                      </div>
                      <div className="text-left">
                        <p className="font-black text-foreground">M-Pesa STK Push</p>
                        <p className="text-xs text-muted-foreground font-black">Instant payment prompt on phone</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full h-16 justify-between group grayscale opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold">Other Methods</p>
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                      </div>
                    </div>
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'phone' && (
              <motion.div
                key="phone"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h2 className="text-2xl font-black flex items-center gap-2 text-foreground">
                    <Smartphone className="h-6 w-6 text-emerald-600" />
                    Enter Phone Number
                  </h2>
                  <p className="text-sm text-muted-foreground font-black">
                    Provide your M-Pesa registered phone number
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        placeholder="07XX XXX XXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="h-12 pl-4 text-lg font-black border-2 focus-visible:ring-emerald-500 bg-background"
                        autoFocus
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      We will send a payment prompt to this number.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="ghost" className="flex-1 h-12" onClick={() => setStep('method')}>
                      Back
                    </Button>
                    <Button 
                      className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      onClick={handleMpesaInit}
                      disabled={isInitializing}
                    >
                      {isInitializing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Initializing...
                        </>
                      ) : 'Confirm & Pay'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'stk_pending' && (
              <motion.div
                key="stk_pending"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col items-center justify-center py-10 space-y-6"
              >
                <div className="relative">
                  <div className="h-24 w-24 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Smartphone className="h-10 w-10 text-emerald-600" />
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">Waiting for PIN...</h3>
                  <p className="text-sm text-muted-foreground max-w-[280px]">
                    Please check your phone and enter your M-Pesa PIN to complete payment.
                  </p>
                </div>

                <div className="w-full bg-muted/30 rounded-xl p-4 border border-dashed border-border">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase text-muted-foreground">Notice</p>
                      <p className="text-xs text-muted-foreground leading-relaxed font-black">
                        If you don&apos;t receive the prompt within 30 seconds, you can switch to offline payment instructions.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-emerald-600 text-xs"
                  onClick={() => setStep('instructions')}
                >
                  Switch to Offline Instructions
                </Button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col items-center justify-center py-8 space-y-6"
              >
                <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center scale-110">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                </div>
                
                <div className="text-center space-y-1">
                  <h3 className="text-2xl font-black text-foreground">Payment Success!</h3>
                  <p className="text-sm text-muted-foreground font-black">
                    Your payment has been successfully processed.
                  </p>
                </div>

                <div className="w-full bg-muted/30 rounded-2xl p-5 border border-border space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-black uppercase tracking-wider">Reference</span>
                    <span className="font-mono font-black text-foreground bg-background px-2 py-1 rounded border border-border">{transactionId || 'RUMI-PAY-XXX'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-black uppercase tracking-wider">Status</span>
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-600 border-none px-2 h-5 text-[9px] uppercase font-black">Completed</Badge>
                  </div>
                </div>

                <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700" asChild>
                  <Link href="/student/payments">Done</Link>
                </Button>
              </motion.div>
            )}

            {step === 'instructions' && (
              <motion.div
                key="instructions"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h2 className="text-2xl font-black flex items-center gap-2 text-foreground">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                    Offline Payment
                  </h2>
                  <p className="text-sm text-muted-foreground font-black">
                    Follow these steps to pay manually via M-Pesa
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Business Number', value: c2bInstructions?.business_number || '174379', type: 'Paybill' },
                    { label: 'Account / Reference', value: c2bInstructions?.reference || 'RUMI-REF-123', type: 'Reference' },
                  ].map((item, i) => (
                    <div key={i} className="bg-muted/30 p-4 rounded-xl border border-border flex justify-between items-center transition-all hover:border-emerald-500/30">
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{item.label}</p>
                        <p className={cn("font-black text-foreground", i === 1 ? "font-mono text-base" : "text-xl")}>{item.value}</p>
                      </div>
                      <Button 
                        variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg"
                        onClick={() => copyToClipboard(item.value, item.type)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="bg-muted/30 p-4 rounded-xl border border-border flex justify-between items-center">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Amount to Pay</p>
                      <p className="text-lg font-black text-foreground">KES {amount.toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-600 bg-emerald-500/5 px-2 h-5 text-[9px] font-black uppercase">Exact</Badge>
                  </div>

                  <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black mb-1 flex items-center gap-1 uppercase">
                      <Info className="h-3 w-3" /> Note
                    </p>
                    <p className="text-[11px] text-blue-600/80 dark:text-blue-300 leading-relaxed font-bold">
                      Your payment will be automatically matched using the reference number. 
                      Please ensure the reference is entered exactly as shown.
                    </p>
                  </div>

                  <Button className="w-full h-12 bg-emerald-600" asChild>
                    <Link href="/student/payments">I have paid</Link>
                  </Button>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
