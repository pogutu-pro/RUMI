"use client";

import * as React from 'react';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  ChevronRight, 
  User, 
  Building2, 
  Calendar,
  ClipboardCheck,
  DollarSign,
  LogOut,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useBooking } from '@/features/bookings';
import { useProcessCheckOut } from '@/features/bookings';
import { toast } from 'sonner';

export default function CheckOutProcessPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [damages, setDamages] = useState<string>('');
  const [deductions, setDeductions] = useState<number>(0);
  
  const { data: booking, isLoading } = useBooking(bookingId as string);
  const processCheckOut = useProcessCheckOut();

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  
  const handleComplete = () => {
      if (!booking) return;
      
      // Simulate payload
      processCheckOut.mutate({
          tenantId: typeof booking.student === 'object' ? booking.student?.id || '' : booking.student || '',
          roomId: typeof booking.room === 'object' ? booking.room?.id || '' : '',
          actualCheckOutDate: new Date().toISOString(),
          reason: 'semester_end', // Default for now
          roomCondition: deductions > 0 ? 'damaged' : 'clean',
          notes: damages,
          processedBy: 'LANDLORD',
          processedAt: new Date().toISOString()
      }, {
          onSuccess: () => {
              toast.success("Check-out processed successfully!");
              router.push('/landlord/tenants/check-outs');
          }
      });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (isLoading) {
      return (
          <div className="max-w-3xl mx-auto space-y-6">
              <Skeleton className="h-12 w-1/3" />
              <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
      );
  }

  if (!booking) {
      return <div className="p-12 text-center text-muted-foreground">Booking not found.</div>;
  }

  const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student';
  const hostelName = typeof booking.hostel === 'object' ? booking.hostel.name : 'Hostel';
  const roomNumber = typeof booking.room === 'object' ? booking.room.room_number : (booking.room_info?.room_number || 'N/A');
  const deposit = 10000; // Mock deposit amount since it might not be in basic booking object in frontend yet.

  return (
    <div className="max-w-3xl mx-auto space-y-8">
       {/* Progress Steps */}
       <div className="flex items-center justify-center">
           <div className={`flex items-center gap-2 ${step >= 1 ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-warning bg-warning/10' : 'border-border'}`}>1</div>
                <span>Review</span>
           </div>
           <div className={`w-16 h-0.5 mx-2 ${step >= 2 ? 'bg-warning' : 'bg-border'}`} />
           <div className={`flex items-center gap-2 ${step >= 2 ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-warning bg-warning/10' : 'border-border'}`}>2</div>
                <span>Inspection</span>
           </div>
           <div className={`w-16 h-0.5 mx-2 ${step >= 3 ? 'bg-warning' : 'bg-border'}`} />
           <div className={`flex items-center gap-2 ${step >= 3 ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-warning bg-warning/10' : 'border-border'}`}>3</div>
                <span>Refund</span>
           </div>
       </div>

       <Card className="border-none shadow-xl overflow-hidden">
           <CardHeader className="bg-muted/30 border-b">
               <CardTitle>Tenant Check-Out Process</CardTitle>
               <CardDescription>Process the departure for {studentName}</CardDescription>
           </CardHeader>
           <div className="relative min-h-[400px]">
             <AnimatePresence mode="wait">
               {step === 1 && (
                   <motion.div 
                     key="step1"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="p-6 space-y-6"
                   >
                       <div className="flex items-center gap-4 p-4 rounded-lg bg-muted border">
                           <Avatar className="h-16 w-16">
                               <AvatarFallback className="bg-warning/10 text-warning font-bold text-xl">{getInitials(studentName)}</AvatarFallback>
                           </Avatar>
                           <div>
                               <h3 className="text-xl font-bold text-primary">{studentName}</h3>
                               <p className="text-muted-foreground">Processing Check-Out</p>
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                               <Label className="text-muted-foreground uppercase text-xs tracking-wider">Property</Label>
                               <div className="flex items-center gap-2 font-medium">
                                   <Building2 className="h-4 w-4 text-warning" />
                                   {hostelName}
                               </div>
                           </div>
                           <div className="space-y-1">
                               <Label className="text-muted-foreground uppercase text-xs tracking-wider">Room</Label>
                               <div className="flex items-center gap-2 font-medium">
                                   <Building2 className="h-4 w-4 text-warning" />
                                   Room {roomNumber}
                               </div>
                           </div>
                           <div className="space-y-1">
                               <Label className="text-muted-foreground uppercase text-xs tracking-wider">Check-Out Date</Label>
                               <div className="flex items-center gap-2 font-medium">
                                   <Calendar className="h-4 w-4 text-warning" />
                                   {format(new Date(), 'MMMM dd, yyyy')}
                               </div>
                           </div>
                       </div>

                       <div className="p-4 rounded-lg bg-info/10 border border-info/30 text-info-foreground text-sm">
                           <p className="font-semibold mb-1">Verify Key Return</p>
                           Have all sets of keys been returned by the tenant?
                           <div className="flex items-center gap-2 mt-2">
                               <Checkbox id="keys" />
                               <label htmlFor="keys" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                   Yes, all keys received
                               </label>
                           </div>
                       </div>
                   </motion.div>
               )}

               {step === 2 && (
                   <motion.div 
                     key="step2"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="p-6 space-y-6"
                   >
                       <div className="space-y-4">
                           <div className="flex items-center justify-between">
                               <h3 className="text-lg font-semibold flex items-center gap-2">
                                   <ClipboardCheck className="h-5 w-5 text-warning" />
                                   Room Inspection
                               </h3>
                           </div>
                           
                           <div className="space-y-4 border rounded-xl p-4">
                               <div className="space-y-2">
                                   <Label>Damage Notes</Label>
                                   <textarea 
                                       className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                       placeholder="Describe any damages found (walls, furniture, fixtures)..."
                                       value={damages}
                                       onChange={(e) => setDamages(e.target.value)}
                                   />
                               </div>
                               <div className="space-y-2">
                                   <Label>Deduction Amount (KES)</Label>
                                   <Input 
                                      type="number" 
                                      placeholder="0" 
                                      value={deductions}
                                      onChange={(e) => setDeductions(Number(e.target.value))}
                                   />
                                   <p className="text-xs text-muted-foreground">Estimated cost for repairs/cleaning.</p>
                               </div>
                           </div>
                           
                           <div className="p-4 rounded-lg bg-muted text-sm text-muted-foreground flex items-start gap-3">
                               <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                               <p>By defining deductions, you agree that these charges are valid and per the lease terms. The tenant will be notified.</p>
                           </div>
                       </div>
                   </motion.div>
               )}

               {step === 3 && (
                   <motion.div 
                     key="step3"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="p-6 space-y-6"
                   >
                        <div className="text-center py-4">
                            <h3 className="text-xl font-bold text-primary mb-6">Final Refund Calculation</h3>
                            
                            <Card className="max-w-sm mx-auto border-dashed">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Security Deposit</span>
                                        <span className="font-medium">KES {deposit.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-destructive">
                                        <span>Deductions</span>
                                        <span>- KES {deductions.toLocaleString()}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Net Refund</span>
                                        <span className="text-success">KES {(deposit - deductions).toLocaleString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <p className="text-muted-foreground text-sm mt-8 max-w-md mx-auto">
                                Confirming will initiate the refund process and officially close this tenancy.
                            </p>
                        </div>
                   </motion.div>
               )}
             </AnimatePresence>
           </div>
           
           <CardFooter className="flex justify-between border-t bg-slate-50/50 p-6">
               <Button variant="ghost" onClick={handlePrev} disabled={step === 1}>
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Back
               </Button>
               {step < 3 ? (
                   <Button onClick={handleNext} className="bg-warning hover:bg-warning/90 text-warning-foreground">
                       Next Step
                       <ChevronRight className="h-4 w-4 ml-2" />
                   </Button>
               ) : (
                   <Button onClick={handleComplete} className="bg-success hover:bg-success/90 text-success-foreground min-w-[140px]" disabled={processCheckOut.isPending}>
                       {processCheckOut.isPending ? 'Processing...' : 'Complete Check-Out'}
                   </Button>
               )}
           </CardFooter>
       </Card>
    </div>
  );
}
