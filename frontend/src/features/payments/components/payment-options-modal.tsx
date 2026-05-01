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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bedId: string;
  amount: number;
  bookingId: string | number;
  onPaymentInitiated?: (transactionRef: string) => void;
}

export function PaymentOptionsModal({
  isOpen,
  onClose,
  bedId,
  amount,
  bookingId,
  onPaymentInitiated
}: PaymentOptionsModalProps) {
  const { toast } = useToast();

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
            Complete your payment via Paystack
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-muted/30 border border-border/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount to pay</span>
              <span className="text-2xl font-bold">{formatCurrency(amount)}</span>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={onClose}
          >
            Pay {formatCurrency(amount)} via Paystack
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
