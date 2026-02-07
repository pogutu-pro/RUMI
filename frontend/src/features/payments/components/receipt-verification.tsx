'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { axiosInstance as axios } from '@/lib/api/client';
import { format } from 'date-fns';

interface VerificationResult {
  valid: boolean;
  receipt_number: string;
  amount: number;
  date: string;
  status: string;
  student_name: string;
  payment_method: string;
  reference: string;
  attribution?: {
    type: string;
    hostel?: string;
    room?: string;
    bed?: string;
  };
}

export function ReceiptVerification() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [loading, setLoading] = React.useState(true);
  const [result, setResult] = React.useState<VerificationResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const verifyReceipt = async () => {
      try {
        const response = await axios.get<VerificationResult>(`/payments/receipts/verify/${id}/`);
        setResult(response.data);
      } catch (err: any) {
        setError(err.response?.status === 404 ? 'Receipt not found' : 'Verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyReceipt();
  }, [id]);

  if (!id) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p>No receipt ID provided.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
         <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Verifying receipt...</p>
         </CardContent>
      </Card>
    );
  }

  if (error || !result) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50">
        <CardHeader className="text-center">
             <XCircle className="h-12 w-12 text-red-500 mx-auto" />
             <CardTitle className="text-red-700">Invalid Receipt</CardTitle>
             <CardDescription className="text-red-600">
                 {error || "This receipt could not be verified in our system."}
             </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-green-200 shadow-lg">
      <CardHeader className="text-center border-b bg-green-50/50">
        <div className="mx-auto bg-green-100 rounded-full p-3 w-fit mb-2">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-green-800">Verified Receipt</CardTitle>
        <CardDescription>
            Official Record from Rumi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
             <div>
                 <p className="text-muted-foreground">Amount</p>
                 <p className="font-bold text-lg">KES {result.amount.toLocaleString()}</p>
             </div>
             <div className="text-right">
                 <p className="text-muted-foreground">Date</p>
                 <p className="font-medium">{format(new Date(result.date), 'PPP')}</p>
             </div>
             
             <div className="col-span-2 border-t pt-4 mt-2">
                 <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Payer</p>
                 <p className="font-semibold">{result.student_name}</p>
             </div>

             {result.attribution && (
                 <div className="col-span-2 bg-muted/50 p-3 rounded-lg">
                     <p className="text-xs text-muted-foreground uppercase mb-2">Payment For</p>
                     <div className="grid grid-cols-2 gap-2">
                        <span>Hostel:</span> <span className="font-medium">{result.attribution.hostel || 'N/A'}</span>
                        <span>Room/Bed:</span> <span className="font-medium">{result.attribution.room || 'N/A'} / {result.attribution.bed || 'N/A'}</span>
                     </div>
                 </div>
             )}

             <div className="col-span-2 text-center pt-4">
                 <Badge variant="outline" className="font-mono text-xs">
                     REF: {result.reference}
                 </Badge>
             </div>
          </div>
      </CardContent>
    </Card>
  );
}
