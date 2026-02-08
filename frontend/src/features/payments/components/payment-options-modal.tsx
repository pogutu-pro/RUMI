'use client';

import * as React from 'react';
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Smartphone, 
  Hash, 
  Users, 
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { initializeMpesaPayment, getPaybillDetails } from '../api/payments';
import type { MpesaInitializeRequest } from '../types';

interface PaymentDetailsData {
  paybill_number: string;
  till_number: string | null;
  account_number: string;
  amount: number;
  hostel_name: string;
  bed_code: string;
  student_phone: string;
  ussd_code?: string;
}

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bedId: string;
  amount: number;
  bookingId: string | number;
  onPaymentInitiated?: (transactionRef: string) => void;
}

function CopyButton({ value }: { value: string | undefined }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    if (!value) return;
    
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({
        title: 'Copied',
        description: 'Copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={copyToClipboard}
      className="h-9 w-9 border-border/50 hover:bg-muted"
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

function Code({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-muted/50 border border-border/50 px-3 py-2 rounded font-mono text-sm ${className}`}>
      {children}
    </div>
  );
}

export function PaymentOptionsModal({
  isOpen,
  onClose,
  bedId,
  amount,
  bookingId,
  onPaymentInitiated
}: PaymentOptionsModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'offline' | 'online'>('offline');
  const { toast } = useToast();

  // Fetch real payment details
  const { data: apiResponse, isLoading: loadingDetails } = useQuery({
    queryKey: ['paybill-details', bedId],
    queryFn: () => getPaybillDetails({ bedId }),
    enabled: isOpen && !!bedId,
  });

  const paymentDetails = apiResponse?.data || {
    paybill_number: 'PENDING',
    till_number: null,
    account_number: 'PENDING',
    amount: amount,
    hostel_name: 'Loading...',
    bed_code: 'Loading...',
    student_phone: '', // Should be fetched from auth user
  };

  const ussdCode = `*234*${paymentDetails.paybill_number}*${paymentDetails.account_number}*${amount}#`;

  // STK Push mutation
  const { mutate: initiateSTK, isPending: stkLoading } = useMutation({
    mutationFn: (data: MpesaInitializeRequest) => initializeMpesaPayment(data),
    onSuccess: (data) => {
      toast({
        title: 'Payment prompt sent',
        description: 'Check your phone and enter your M-Pesa PIN',
      });
      if (onPaymentInitiated && data.transaction_reference) {
        onPaymentInitiated(data.transaction_reference);
      }
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Failed to initiate payment',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleSTKPush = () => {
    initiateSTK({
      booking_id: bookingId,
      payment_type: 'rent',
      payment_method: 'stk_push',
      phone_number: paymentDetails.student_phone,
      amount: amount,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Make Payment</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method
          </DialogDescription>
        </DialogHeader>

        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="offline">Offline Payment</TabsTrigger>
            <TabsTrigger value="online">Pay Now (STK Push)</TabsTrigger>
          </TabsList>

          {/* OFFLINE PAYMENT INSTRUCTIONS */}
          <TabsContent value="offline" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Pay using any M-Pesa method: USSD (*234#), M-Pesa app, SIM toolkit, or agent
            </div>

            {/* Paybill/Till Number */}
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground font-semibold">
                {paymentDetails.till_number ? 'Till Number' : 'Paybill Number'}
              </Label>
              <div className="flex items-center gap-2">
                <Code className="flex-1 text-lg font-semibold">
                  {paymentDetails.till_number || paymentDetails.paybill_number}
                </Code>
                <CopyButton value={paymentDetails.till_number || paymentDetails.paybill_number} />
              </div>
            </div>

            {/* Account Number (only for Paybill) */}
            {!paymentDetails.till_number && (
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-semibold">
                  Account Number
                </Label>
                <div className="flex items-center gap-2">
                  <Code className="flex-1 text-lg font-semibold">
                    {paymentDetails.account_number}
                  </Code>
                  <CopyButton value={paymentDetails.account_number} />
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground font-semibold">
                Amount
              </Label>
              <div className="text-2xl font-bold">
                {formatCurrency(amount)}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Payment Methods */}
            <div className="space-y-3">
              <Label className="text-xs uppercase text-muted-foreground font-semibold">
                How to Pay
              </Label>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <strong>M-Pesa App:</strong> Lipa na M-Pesa → {paymentDetails.till_number ? 'Buy Goods' : 'Paybill'}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Hash className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <strong>USSD Code:</strong> Dial *234# and follow prompts
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <strong>SIM Toolkit:</strong> M-Pesa menu on your SIM
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <strong>M-Pesa Agent:</strong> Visit any agent with the details above
                  </div>
                </div>
              </div>

              {/* Quick USSD */}
              <Separator className="my-4" />
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-semibold">
                  Quick Dial (Optional)
                </Label>
                <div className="flex items-center gap-2">
                  <Code className="flex-1 break-all">
                    {ussdCode}
                  </Code>
                  <CopyButton value={ussdCode} />
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* After Payment */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-sem

ibold">After payment:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>You'll receive M-Pesa SMS confirmation</li>
                <li>Dashboard updates within 60 seconds</li>
                <li>Receipt emailed automatically</li>
              </ul>
            </div>
          </TabsContent>

          {/* ONLINE PAYMENT (STK PUSH) */}
          <TabsContent value="online" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              We'll send a payment prompt to your phone. Enter your M-Pesa PIN to complete.
            </div>

            {/* Amount Summary */}
            <div className="bg-muted/30 border border-border/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount to pay</span>
                <span className="text-2xl font-bold">{formatCurrency(amount)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                To: {paymentDetails.hostel_name} • Bed: {paymentDetails.bed_code}
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label>M-Pesa Phone Number</Label>
              <Input
                type="tel"
                value={paymentDetails.student_phone}
                readOnly
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Payment prompt will be sent to this number
              </p>
            </div>

            {/* Pay Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSTKPush}
              disabled={stkLoading}
            >
              {stkLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending payment prompt...
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Pay {formatCurrency(amount)}
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              Secure payment powered by Safaricom M-Pesa
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
