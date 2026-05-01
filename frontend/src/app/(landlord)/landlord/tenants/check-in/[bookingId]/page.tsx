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
  FileCheck,
  KeyRound,
  UploadCloud,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBooking } from '@/features/bookings';
import { useProcessCheckIn } from '@/features/bookings';
import { toast } from 'sonner';

export default function CheckInProcessPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  
  const { data: booking, isLoading } = useBooking(bookingId as string);
  const processCheckIn = useProcessCheckIn();

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  
  const handleComplete = () => {
      // Logic to submit check-in
      // Assuming processCheckIn takes bookingId and maybe file URLs (simulated)
      if (!booking) return;
      
      processCheckIn.mutate({
          tenantId: typeof booking.student === 'object' ? booking.student?.id || '' : booking.student || '',
          bookingCode: booking.booking_reference || 'MANUAL',
          roomId: typeof booking.room === 'object' ? booking.room?.id || '' : '',
          actualCheckInDate: new Date().toISOString(),
          identityVerified: true,
          bookingVerified: true,
          notes: "Checked in via Landlord Portal",
          processedBy: 'LANDLORD',
          processedAt: new Date().toISOString()
      }, {
          onSuccess: () => {
              toast.success("Check-in completed successfully!");
              router.push('/landlord/tenants/check-ins');
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
  const studentEmail = typeof booking.student === 'object' ? booking.student.email : '';
  const hostelName = typeof booking.hostel === 'object' ? booking.hostel.name : 'Hostel';
  const roomNumber = typeof booking.room === 'object' ? booking.room.room_number : (booking.room_info?.room_number || 'N/A');

  return (
    <div className="max-w-3xl mx-auto space-y-8">
       {/* Progress Steps */}
       <div className="flex items-center justify-center">
           <div className={`flex items-center gap-2 ${step >= 1 ? 'text-success font-medium' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-success bg-success/10' : 'border-border'}`}>1</div>
                <span>Verify</span>
           </div>
           <div className={`w-16 h-0.5 mx-2 ${step >= 2 ? 'bg-success' : 'bg-border'}`} />
           <div className={`flex items-center gap-2 ${step >= 2 ? 'text-success font-medium' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-success bg-success/10' : 'border-border'}`}>2</div>
                <span>Documents</span>
           </div>
           <div className={`w-16 h-0.5 mx-2 ${step >= 3 ? 'bg-success' : 'bg-border'}`} />
           <div className={`flex items-center gap-2 ${step >= 3 ? 'text-success font-medium' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-success bg-success/10' : 'border-border'}`}>3</div>
                <span>Handover</span>
           </div>
       </div>

       <Card className="border-none shadow-xl overflow-hidden">
           <CardHeader className="bg-muted/30 border-b">
               <CardTitle>Tenant Check-In Process</CardTitle>
               <CardDescription>Follow the steps to complete the move-in for {studentName}</CardDescription>
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
                               <AvatarFallback className="bg-success/10 text-success font-bold text-xl">{getInitials(studentName)}</AvatarFallback>
                           </Avatar>
                           <div>
                               <h3 className="text-xl font-bold text-primary">{studentName}</h3>
                               <p className="text-muted-foreground">{studentEmail}</p>
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                               <Label className="text-muted-foreground uppercase text-xs tracking-wider">Property</Label>
                               <div className="flex items-center gap-2 font-medium">
                                   <Building2 className="h-4 w-4 text-success" />
                                   {hostelName}
                               </div>
                           </div>
                           <div className="space-y-1">
                               <Label className="text-muted-foreground uppercase text-xs tracking-wider">Room Assigned</Label>
                               <div className="flex items-center gap-2 font-medium">
                                   <HomeIcon className="h-4 w-4 text-success" />
                                   Room {roomNumber}
                               </div>
                           </div>
                           <div className="space-y-1">
                               <Label className="text-muted-foreground uppercase text-xs tracking-wider">Move-In Date</Label>
                               <div className="flex items-center gap-2 font-medium">
                                   <Calendar className="h-4 w-4 text-success" />
                                   {format(new Date(booking.move_in_date), 'MMMM dd, yyyy')}
                               </div>
                           </div>
                           <div className="space-y-1">
                               <Label className="text-muted-foreground uppercase text-xs tracking-wider">Duration</Label>
                               <div className="flex items-center gap-2 font-medium">
                                   <ClockIcon className="h-4 w-4 text-success" />
                                   {booking.duration_months || 1} Months
                               </div>
                           </div>
                       </div>
                       
                       <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 text-warning-foreground text-sm">
                           <p className="font-semibold mb-1 flex items-center gap-2">
                               <AlertCircleIcon className="h-4 w-4" />
                               Verify Identity
                           </p>
                           Ensure the tenant's ID matches the details above before proceeding.
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
                       <div className="text-center space-y-2 mb-8">
                           <UploadCloud className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                           <h3 className="text-lg font-semibold">Upload Signed Documents</h3>
                           <p className="text-sm text-muted-foreground">Upload the signed lease agreement and any initial room condition photos.</p>
                       </div>

                       <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 hover:border-success transition-all cursor-pointer">
                           <p className="text-success font-medium">Click to browse files</p>
                           <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG supported</p>
                       </div>
                       
                       <div className="space-y-3">
                           <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                               <FileCheck className="h-5 w-5 text-success" />
                               <span className="text-sm font-medium">Standard_Lease_Agreement.pdf</span>
                               <span className="text-xs text-muted-foreground ml-auto">System Generated</span>
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
                        <div className="text-center py-8">
                            <div className="h-20 w-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <KeyRound className="h-10 w-10 text-success" />
                            </div>
                            <h3 className="text-2xl font-bold text-primary mb-2">Ready for Handover</h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                By clicking complete, you confirm that physical keys have been handed over to <strong>{studentName}</strong> and the room inspection is satisfactory.
                            </p>
                        </div>
                   </motion.div>
               )}
             </AnimatePresence>
           </div>
           
           <CardFooter className="flex justify-between border-t bg-muted/30 p-6">
               <Button variant="ghost" onClick={handlePrev} disabled={step === 1}>
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Back
               </Button>
               {step < 3 ? (
                   <Button onClick={handleNext} className="bg-success hover:bg-success/90 text-success-foreground">
                       Next Step
                       <ChevronRight className="h-4 w-4 ml-2" />
                   </Button>
               ) : (
                   <Button onClick={handleComplete} className="bg-success hover:bg-success/90 text-success-foreground min-w-[140px]" disabled={processCheckIn.isPending}>
                       {processCheckIn.isPending ? 'Processing...' : 'Complete Check-In'}
                   </Button>
               )}
           </CardFooter>
       </Card>
    </div>
  );
}

// Helper icons
function HomeIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function ClockIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function AlertCircleIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>; }
