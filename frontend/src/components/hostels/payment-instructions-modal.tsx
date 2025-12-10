'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  Check, 
  CreditCard, 
  Building2,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostelName: string;
  amount: number;
  currency?: string;
  paybillNumber?: string;
  accountNumber?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  onConfirmPayment: () => void;
  isConfirming?: boolean;
}

/**
 * PaymentInstructionsModal - Display payment details and instructions
 * Shows hostel-specific payment methods (M-Pesa Paybill or Bank Transfer)
 */
export default function PaymentInstructionsModal({
  isOpen,
  onClose,
  hostelName,
  amount,
  currency = 'KES',
  paybillNumber,
  accountNumber,
  bankDetails,
  onConfirmPayment,
  isConfirming = false,
}: PaymentInstructionsModalProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasPaybill = paybillNumber && accountNumber;
  const hasBankDetails = bankDetails?.bankName && bankDetails?.accountNumber;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Payment Instructions</DialogTitle>
          <DialogDescription>
            Complete your booking for {hostelName}
          </DialogDescription>
        </DialogHeader>

        {/* Amount Display */}
        <div className="my-6 p-6 rounded-xl bg-emerald-50 border-2 border-emerald-200">
          <div className="text-center">
            <p className="text-sm text-emerald-700 font-medium mb-1">Total Amount</p>
            <p className="text-4xl font-bold text-emerald-900">
              {currency} {amount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-6">
          {/* M-Pesa Paybill */}
          {hasPaybill && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                <span>M-Pesa Paybill</span>
              </div>
              
              <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Paybill Number
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-white border border-gray-300 rounded-lg font-mono text-sm font-bold">
                      {paybillNumber}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(paybillNumber, 'Paybill number')}
                      className="shrink-0"
                    >
                      {copiedField === 'Paybill number' ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Account Number
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-white border border-gray-300 rounded-lg font-mono text-sm font-bold">
                      {accountNumber}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(accountNumber!, 'Account number')}
                      className="shrink-0"
                    >
                      {copiedField === 'Account number' ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Steps */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Steps:</p>
                  <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Go to M-Pesa menu</li>
                    <li>Select "Lipa na M-Pesa"</li>
                    <li>Select "Paybill"</li>
                    <li>Enter Business Number: <strong>{paybillNumber}</strong></li>
                    <li>Enter Account Number: <strong>{accountNumber}</strong></li>
                    <li>Enter Amount: <strong>{amount.toLocaleString()}</strong></li>
                    <li>Enter your M-Pesa PIN and confirm</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Bank Transfer */}
          {hasBankDetails && (
            <>
              {hasPaybill && (
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs font-medium text-gray-500">OR</span>
                  <Separator className="flex-1" />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  <span>Bank Transfer</span>
                </div>
                
                <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Bank Name</label>
                    <div className="p-3 bg-white border border-gray-300 rounded-lg text-sm font-semibold">
                      {bankDetails.bankName}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Account Number</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-white border border-gray-300 rounded-lg font-mono text-sm font-bold">
                        {bankDetails.accountNumber}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(bankDetails.accountNumber, 'Bank account')}
                        className="shrink-0"
                      >
                        {copiedField === 'Bank account' ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Account Name</label>
                    <div className="p-3 bg-white border border-gray-300 rounded-lg text-sm font-semibold">
                      {bankDetails.accountName}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Important Notice */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-900">
            <strong>Important:</strong> After making payment, click "I have paid" below. 
            Our team will verify your payment within 24 hours.
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirmPayment}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            disabled={isConfirming}
          >
            {isConfirming ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <CreditCard className="h-4 w-4" />
                </motion.div>
                Confirming...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                I have paid
              </>
            )}
          </Button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-center text-gray-500 pt-2">
          Keep your payment confirmation message for reference
        </p>
      </DialogContent>
    </Dialog>
  );
}
