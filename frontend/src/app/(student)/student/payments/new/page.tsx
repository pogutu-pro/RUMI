'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useRentPeriods, useCurrentRentPeriod, useInitializeMpesaPayment, useMpesaPaymentStatus } from '@/features/payments/hooks/use-payments';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PriceDisplay } from '@/components/ui/price-display';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  Copy, 
  Info, 
  ArrowRight, 
  User, 
  Building, 
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Activity,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

export default function NewPaymentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: rentPeriods, isLoading: isPeriodsLoading } = useRentPeriods({ status: 'unpaid' });
  const { data: currentPeriod } = useCurrentRentPeriod();
  
  const [selectedPeriod, setSelectedPeriod] = React.useState<any>(null);
  const [editableAmount, setEditableAmount] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState(user?.phone_number || '');
  const [isStkPending, setIsStkPending] = React.useState(false);
  const [transactionId, setTransactionId] = React.useState('');
  const [checkoutId, setCheckoutId] = React.useState('');
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'stk_push' | 'paybill' | 'paystack'>('stk_push');

  const { mutate: initializeMpesa, isPending: isInitializing } = useInitializeMpesaPayment();
  const { data: statusData } = useMpesaPaymentStatus(
    { transaction_id: transactionId }, 
    { enabled: isStkPending, refetchInterval: 3000 }
  );

  React.useEffect(() => {
    if (currentPeriod && !selectedPeriod) {
      setSelectedPeriod(currentPeriod);
      setEditableAmount(currentPeriod.balance.toString());
    } else if (rentPeriods && rentPeriods.length > 0 && !selectedPeriod) {
        const primary = rentPeriods.find(p => p.status === 'overdue' || p.status === 'due') || rentPeriods[0];
        setSelectedPeriod(primary);
        setEditableAmount(primary.balance.toString());
    }
  }, [currentPeriod, rentPeriods, selectedPeriod]);

  React.useEffect(() => {
    if (statusData?.status === 'success') {
      setIsStkPending(false);
      setPaymentSuccess(true);
      toast.success('Payment successful');
    } else if (statusData?.status === 'failed' || statusData?.status === 'cancelled') {
      setIsStkPending(false);
      toast.error('Payment failed or cancelled.');
    }
  }, [statusData]);

  const handleMpesaInit = async () => {
    if (paymentMethod === 'paybill') {
        toast.info('Follow manual Paybill instructions.');
        return;
    }

    if (paymentMethod === 'paystack') {
        toast.info('Paystack available soon.');
        return;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Enter a valid phone number');
      return;
    }

    if (!selectedPeriod) {
      toast.error('Select a rent period');
      return;
    }

    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;
    
    if (formattedPhone.length !== 12) {
      toast.error('Invalid phone format');
      return;
    }

    const finalAmount = parseFloat(editableAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    initializeMpesa(
      {
        booking_id: selectedPeriod.booking,
        rent_period_id: selectedPeriod.id,
        payment_type: 'rent',
        payment_method: 'stk_push',
        phone_number: formattedPhone,
        amount: finalAmount
      },
      {
        onSuccess: (data) => {
          setTransactionId(data.transaction_id.toString());
          setCheckoutId(data.checkout_request_id);
          setIsStkPending(true);
        },
        onError: (error: any) => {
          toast.error(error.message || 'Payment initialization failed.');
        }
      }
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  if (isPeriodsLoading) {
      return (
          <div className="max-w-5xl mx-auto p-6 space-y-8 animate-pulse">
              <div className="h-10 w-48 bg-muted rounded-lg" />
              <div className="grid md:grid-cols-2 gap-8">
                  <div className="h-64 bg-muted rounded-lg" />
                  <div className="h-64 bg-muted rounded-lg" />
              </div>
          </div>
      );
  }

  if (paymentSuccess) {
      return (
          <div className="max-w-2xl mx-auto py-20 px-6 text-center space-y-8">
                <div className="h-24 w-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="h-14 w-14 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-foreground uppercase border-b-4 border-emerald-500 inline-block pb-1">Payment Successful</h3>
                  <p className="text-muted-foreground font-medium">The ledger has been updated.</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-8 space-y-4 shadow-none">
                    <div className="flex justify-between items-center border-b border-border pb-4">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reference</span>
                      <span className="font-mono font-black text-foreground">{transactionId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Amount</span>
                      <PriceDisplay amount={parseFloat(editableAmount)} size="lg" className="font-black text-emerald-600" />
                    </div>
                </div>
                <Button className="w-full h-14 bg-primary text-primary-foreground font-black text-lg rounded-lg uppercase tracking-tight" asChild>
                  <Link href="/student/payments">Back to Ledger</Link>
                </Button>
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Make Payment</h1>
          <p className="text-muted-foreground font-medium text-lg">Pay rent via M-Pesa or view manual bank details.</p>
        </div>
        
        {rentPeriods && rentPeriods.length > 1 && (
            <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border border-border">
                <span className="text-[10px] font-black uppercase text-muted-foreground px-2">Cycle:</span>
                <div className="flex gap-1">
                    {rentPeriods.filter(p => p.status !== 'paid').map(period => (
                        <button
                            key={period.id}
                            onClick={() => {
                                setSelectedPeriod(period);
                                setEditableAmount(period.balance.toString());
                            }}
                            className={cn(
                                "h-9 px-4 rounded-md text-xs font-black uppercase tracking-tighter transition-colors",
                                selectedPeriod?.id === period.id 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-background text-muted-foreground border border-border hover:bg-muted"
                            )}
                        >
                            {new Date(period.start_date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-12 grid md:grid-cols-3 gap-4">
            <Card className="border-border shadow-none bg-card rounded-lg">
                <CardHeader className="py-4 border-b border-border">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tenant</CardTitle>
                </CardHeader>
                <CardContent className="py-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-foreground uppercase tracking-tight">{user?.first_name} {user?.last_name}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{user?.email}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border shadow-none bg-card rounded-lg">
                <CardHeader className="py-4 border-b border-border">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Property Details</CardTitle>
                </CardHeader>
                <CardContent className="py-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-muted-foreground uppercase">Hostel</span>
                        <p className="text-xs font-black text-foreground">{selectedPeriod?.hostel_details?.name || '---'}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-muted-foreground uppercase">Space ID</span>
                        <p className="text-xs font-black text-foreground">{(selectedPeriod as any)?.room_details?.room_number || '---'} / Bed {(selectedPeriod as any)?.bed_id || '01'}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border shadow-none bg-card rounded-lg">
                <CardHeader className="py-4 border-b border-border">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ledger Balance</CardTitle>
                </CardHeader>
                <CardContent className="py-6 space-y-3">
                     <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black text-muted-foreground uppercase">Balance Due</span>
                         <PriceDisplay amount={selectedPeriod?.balance || 0} size="md" className="font-black text-foreground" />
                     </div>
                     <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black text-muted-foreground uppercase opacity-60">Status</span>
                         <StatusBadge status={selectedPeriod?.status || 'Active'} className="text-[8px] font-black px-2 h-4" />
                     </div>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-12">
            <Card className="border border-border shadow-none rounded-lg bg-card">
                <CardHeader className="p-8 border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1 text-center md:text-left">
                            <CardTitle className="text-xl font-black uppercase tracking-tight">Payment Method</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase text-muted-foreground">Select one of the options below</CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2 bg-muted/50 p-1.5 rounded-lg border border-border">
                            {[
                                { id: 'stk_push', label: 'M-Pesa Prompt', icon: Smartphone },
                                { id: 'paybill', label: 'Manual Paybill', icon: Hash },
                                { id: 'paystack', label: 'Card/Bank', icon: CreditCard }
                            ].map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as any)}
                                    className={cn(
                                        "flex items-center gap-2 h-9 px-4 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors",
                                        paymentMethod === method.id 
                                            ? "bg-primary text-primary-foreground" 
                                            : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <method.icon className="h-3.5 w-3.5" />
                                    {method.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="p-8 md:p-12">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount to Pay (KES)</Label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground opacity-30">KES</div>
                                        <Input
                                            id="amount"
                                            type="number"
                                            value={editableAmount}
                                            onChange={(e) => setEditableAmount(e.target.value)}
                                            className="h-20 pl-24 text-4xl font-black rounded-lg bg-muted/20 border border-border focus-visible:ring-0 focus-visible:border-primary transition-colors"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {paymentMethod === 'stk_push' && (
                                    <div className="space-y-3">
                                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="07XX XXX XXX"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="h-16 text-2xl font-black rounded-lg bg-muted/20 border border-border focus-visible:ring-0 focus-visible:border-primary"
                                        />
                                    </div>
                                )}

                                {paymentMethod === 'paybill' && (
                                    <div className="space-y-4 bg-muted/20 p-6 rounded-lg border border-border">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <Label className="text-[9px] uppercase font-black text-muted-foreground">M-Pesa Paybill</Label>
                                                <div className="flex items-center justify-between bg-background p-3 rounded border border-border">
                                                    <span className="text-xl font-black font-mono">{selectedPeriod?.assigned_paybill || '174379'}</span>
                                                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(selectedPeriod?.assigned_paybill || '174379', 'Paybill')}>
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[9px] uppercase font-black text-muted-foreground">Account Number</Label>
                                                <div className="flex items-center justify-between bg-background p-3 rounded border border-border">
                                                    <span className="text-xl font-black font-mono">{selectedPeriod?.student_account_ref || '---'}</span>
                                                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(selectedPeriod?.student_account_ref || '', 'Account')}>
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-muted/30 p-6 rounded-lg border border-border space-y-4">
                                <h4 className="font-black uppercase tracking-tight text-sm">Payment Steps</h4>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0 border border-primary/20">1</span>
                                        <p className="text-xs font-bold text-muted-foreground">Enter the amount you wish to pay.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0 border border-primary/20">2</span>
                                        <p className="text-xs font-bold text-muted-foreground">Select your preferred payment method.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0 border border-primary/20">3</span>
                                        <p className="text-xs font-bold text-muted-foreground">Confirm and follow the instructions on your phone.</p>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                className="w-full h-24 bg-primary text-primary-foreground font-black text-2xl rounded-lg uppercase tracking-tight shadow-none disabled:opacity-50"
                                onClick={handleMpesaInit}
                                disabled={isInitializing || isStkPending}
                            >
                                {isInitializing ? (
                                    <>
                                        <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                                        Processing...
                                    </>
                                ) : isStkPending ? (
                                    <>
                                        <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                                        Awaiting PIN...
                                    </>
                                ) : (
                                    <>
                                        {paymentMethod === 'stk_push' ? 'Pay with M-Pesa' : 'Confirm Selection'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {isStkPending && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-none z-50 flex items-center justify-center p-6">
              <Card className="max-w-md w-full border-2 border-primary shadow-none rounded-lg overflow-hidden">
                  <div className="bg-primary text-primary-foreground p-4 font-black uppercase text-xs tracking-widest text-center">
                      Payment Processing
                  </div>
                  <CardContent className="p-8 text-center space-y-6">
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto border-2 border-primary/20">
                          <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      </div>
                      <div className="space-y-2">
                          <h4 className="text-xl font-black uppercase tracking-tight">Check your Phone</h4>
                          <p className="text-sm font-bold text-muted-foreground leading-snug">
                              Enter your M-Pesa PIN on your phone to complete the transaction of <span className="text-foreground">KES {editableAmount}</span>.
                          </p>
                      </div>
                      <div className="pt-4 space-y-2">
                          <Button variant="outline" className="w-full h-12 font-black uppercase text-xs tracking-widest rounded-lg" onClick={() => setIsStkPending(false)}>
                              Cancel Attempt
                          </Button>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Do not refresh this page.</p>
                      </div>
                  </CardContent>
              </Card>
          </div>
      )}
    </div>
  );
}
