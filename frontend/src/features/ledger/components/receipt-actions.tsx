'use client';

import { Download, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDownloadReceipt, useResendReceipt } from '../hooks/use-ledger';

export function ReceiptDownloadButton({ receipt }: { receipt: { id: string; number: string } }) {
  const download = useDownloadReceipt();
  return (
    <Button
      variant="ghost"
      size="sm"
      leftIcon={<Download className="h-4 w-4" />}
      isLoading={download.isPending}
      onClick={() => download.mutate(receipt)}
    >
      {receipt.number}
    </Button>
  );
}

export function ReceiptResendButton({ receiptId }: { receiptId: string }) {
  const resend = useResendReceipt();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Resend receipt to tenant"
      title="Resend receipt to tenant"
      isLoading={resend.isPending}
      onClick={() => resend.mutate(receiptId)}
    >
      <Send className="h-4 w-4" />
    </Button>
  );
}
