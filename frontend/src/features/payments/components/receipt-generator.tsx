'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api/client';
import type { ApiResponse } from '@/types/api.types';

interface ReceiptGeneratorProps {
  transactionRef: string;
  trigger?: React.ReactNode;
}

interface ReceiptResponse {
  receipt_url: string;
  receipt_number: string;
  generated_at: string;
}

export function ReceiptGenerator({ transactionRef, trigger }: ReceiptGeneratorProps) {
  const { toast } = useToast();

  const { mutate: generateReceipt, isPending } = useMutation({
    mutationFn: async () => {
      const response = await apiClient.axios.post<ApiResponse<ReceiptResponse>>(
        '/payments/receipts/generate/',
        { transaction_reference: transactionRef }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      if (data?.receipt_url) {
        // Download PDF
        window.open(data.receipt_url, '_blank');
        toast({
          title: 'Receipt downloaded',
          description: `Receipt number: ${data.receipt_number}`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate receipt',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleDownload = () => {
    generateReceipt();
  };

  // If custom trigger provided, use it
  if (React.isValidElement(trigger)) {
    return React.cloneElement(trigger as React.ReactElement<any>, {
      onClick: handleDownload,
      disabled: isPending,
    });
  }

  // Default button
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4 mr-2" />
          Download Receipt
        </>
      )}
    </Button>
  );
}


// Email receipt function (can be used separately)
export async function emailReceipt(transactionRef: string, email: string) {
  const response = await apiClient.axios.post('/payments/receipts/email/', {
    transaction_reference: transactionRef,
    email,
  });
  return response.data;
}
