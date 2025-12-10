'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft,
  User,
  Package,
  Calendar,
  DollarSign
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { inventoryApi } from '@/lib/api/inventory';
import { toast } from 'sonner';

interface PageProps {
  params: {
    reportId: string;
  };
}

export default function LandlordApprovalDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { activeReport, isLoading, fetchReportById } = useInventoryStore();
  const [disputeReason, setDisputeReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (params.reportId) {
      fetchReportById(params.reportId);
    }
  }, [params.reportId, fetchReportById]);

  if (isLoading || !activeReport) {
    return (
       <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-8">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const flaggedItems = activeReport.items.filter(i => i.isFlagged);
  const totalDamage = activeReport.items.reduce((acc, curr) => acc + (curr.damageCost || 0), 0);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await inventoryApi.approveReport({
        reportId: activeReport.id,
        action: 'approve'
      });
      toast.success('Report Approved Successfully');
      router.push('/landlord/approvals');
    } catch (error) {
      toast.error('Failed to approve report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason) {
      toast.error('Please provide a reason for the dispute');
      return;
    }
    setIsSubmitting(true);
    try {
      await inventoryApi.approveReport({
        reportId: activeReport.id,
        action: 'dispute',
        disputeReason
      });
      toast.success('Report Returned to Caretaker');
      router.push('/landlord/approvals');
    } catch (error) {
      toast.error('Failed to dispute report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review Report</h1>
          <p className="text-sm text-muted-foreground">
             Please review the verification details below.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         {/* Key Details */}
         <Card>
           <CardHeader>
             <CardTitle className="text-base">Details</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                 <span className="text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4"/> Room</span>
                 <span className="font-semibold">{activeReport.roomNumber}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                 <span className="text-muted-foreground flex items-center gap-2"><User className="h-4 w-4"/> Tenant</span>
                 <span className="font-semibold">{activeReport.studentId}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                 <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> Submitted</span>
                 <span className="font-semibold">{new Date(activeReport.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="pt-2">
                <span className="text-muted-foreground text-sm block mb-1">Caretaker Note:</span>
                <p className="text-sm italic bg-muted p-2 rounded">{activeReport.caretakerNote || "No notes provided."}</p>
              </div>
           </CardContent>
         </Card>

         {/* Damage Summary */}
         <Card className={activeReport.type === 'check_out' ? 'border-amber-200 bg-amber-50' : ''}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                 {activeReport.type === 'check_out' ? <DollarSign className="h-5 w-5 text-amber-600" /> : <CheckCircle2 className="h-5 w-5 text-green-600" />}
                 {activeReport.type === 'check_out' ? 'Damage & Charges' : 'Condition Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {activeReport.type === 'check_out' ? (
                 <>
                    <div className="text-center py-4">
                       <p className="text-sm text-muted-foreground mb-1">Total Chargeable Damage</p>
                       <p className="text-4xl font-bold text-destructive">KES {totalDamage.toLocaleString()}</p>
                    </div>
                    {totalDamage > 0 && (
                      <p className="text-xs text-center text-muted-foreground">
                        An invoice will be generated for the student upon approval.
                      </p>
                    )}
                 </>
               ) : (
                  <div className="text-center py-4">
                     <p className="text-sm text-muted-foreground">Check-In Verification</p>
                     <p className="text-xl font-semibold mt-2 text-green-700">Ready for Move-In</p>
                  </div>
               )}
            </CardContent>
         </Card>
      </div>

      {/* Flagged Items / Differences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Flagged Items / Discrepancies
          </CardTitle>
          <CardDescription>
            Items where the caretaker found issues or disagreed with the student's report.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {flaggedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                 <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
                 <p>No discrepancies found. All items match expected condition.</p>
              </div>
           ) : (
             <div className="space-y-4">
                {flaggedItems.map((item) => (
                   <div key={item.itemId} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5">
                      <div className="flex-1">
                         <h4 className="font-bold">{item.itemSnapshot.name}</h4>
                         <div className="flex gap-2 mt-2">
                           <Badge variant="outline" className="opacity-70">Student: {item.studentCondition}</Badge>
                           <ArrowRight className="h-4 w-4 text-muted-foreground" />
                           <Badge>{item.caretakerCondition}</Badge>
                         </div>
                         {item.caretakerComment && (
                            <p className="text-sm mt-2 text-muted-foreground">Note: "{item.caretakerComment}"</p>
                         )}
                      </div>
                      {item.isChargeable && (
                        <div className="flex-shrink-0 text-right">
                           <Badge variant="destructive">Chargeable</Badge>
                           <p className="font-bold text-lg mt-1">KES {item.damageCost?.toLocaleString()}</p>
                        </div>
                      )}
                   </div>
                ))}
             </div>
           )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-4 pt-4 border-t">
         <div className="flex gap-4">
            <Button size="lg" className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isSubmitting}>
               <CheckCircle2 className="mr-2 h-5 w-5" /> Approve Report
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                 <Button size="lg" variant="destructive" className="flex-1" disabled={isSubmitting}>
                    <XCircle className="mr-2 h-5 w-5" /> Dispute Report
                 </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Dispute Report</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will send the report back to the caretaker for correction. Please provide a reason.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                   <Textarea 
                      placeholder="Reason for dispute..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                   />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDispute}>Confirm Dispute</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
         </div>
         <p className="text-xs text-center text-muted-foreground">
            Approving this report is final. Ensure all charges and conditions are accurate.
         </p>
      </div>
    </div>
  );
}
