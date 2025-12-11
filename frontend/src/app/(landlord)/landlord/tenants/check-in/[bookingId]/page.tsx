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
import { useBooking } from '@/hooks/use-booking';
import { useProcessCheckIn } from '@/hooks/use-check-in-out';
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
          bookingId: booking.id,
          // other data like meter readings, inventory check can be added here
          notes: "Checked in via Landlord Portal"
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
      return <div className="p-12 text-center text-slate-500">Booking not found.</div>;
  }

  const studentName = typeof booking.student === 'object' ? `${booking.student.first_name} ${booking.student.last_name}` : 'Student';
  const studentEmail = typeof booking.student === 'object' ? booking.student.email : '';
  const hostelName = typeof booking.hostel === 'object' ? booking.hostel.name : 'Hostel';
  const roomNumber = typeof booking.room === 'object' ? booking.room.number : (booking.room_number || 'N/A');

  return (
    <div className="max-w-3xl mx-auto space-y-8">
       {/* Progress Steps */}
       <div className="flex items-center justify-center">
           <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300'}`}>1</div>
                <span>Verify</span>
           </div>
           <div className={`w-16 h-0.5 mx-2 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
           <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300'}`}>2</div>
                <span>Documents</span>
           </div>
           <div className={`w-16 h-0.5 mx-2 ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
           <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300'}`}>3</div>
                <span>Handover</span>
           </div>
       </div>

       <Card className="border-none shadow-xl overflow-hidden">
           <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
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
                       <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border">
                           <Avatar className="h-16 w-16">
                               <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold text-xl">{getInitials(studentName)}</AvatarFallback>
                           </Avatar>
                           <div>
                               <h3 className="text-xl font-bold text-slate-900">{studentName}</h3>
                               <p className="text-slate-500">{studentEmail}</p>
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                               <Label className="text-slate-500 uppercase text-xs tracking-wider">Property</Label>
                               <div className="flex items-center gap-2 font-medium">
                                   <Building2 className="h-4 w-4 text-emerald-600" />
                                   {hostelName}
                               </div>
                           </div>
                           <div className="space-y-1">
                               <Label className="text-slate-500 uppercase text-xs tracking-wider">Room Assigned</Label>
                               <div className="flex items-center gap-2 font-medium">
                                   <HomeIcon className="h-4 w-4 text-emerald-600" />
                                   Room {roomNumber}
                               </div>
                           </div>
                           <div className="space-y-1">
                               <Label className="text-slate-500 uppercase text-xs tracking-wider">Move-In Date</Label>
                               <div className="flex items-center gap-2 font-medium">
                                   <Calendar className="h-4 w-4 text-emerald-600" />
                                   {format(new Date(booking.check_in_date), 'MMMM dd, yyyy')}
                               </div>
                           </div>
                           <div className="space-y-1">
                               <Label className="text-slate-500 uppercase text-xs tracking-wider">Duration</Label>
                               <div className="flex items-center gap-2 font-medium">
                                   <ClockIcon className="h-4 w-4 text-emerald-600" />
                                   {booking.duration || 1} Months
                               </div>
                           </div>
                       </div>
                       
                       <div className="p-4 rounded-lg bg-orange-50 border border-orange-100 text-orange-800 text-sm">
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
                           <UploadCloud className="h-12 w-12 text-slate-300 mx-auto" />
                           <h3 className="text-lg font-semibold">Upload Signed Documents</h3>
                           <p className="text-sm text-slate-500">Upload the signed lease agreement and any initial room condition photos.</p>
                       </div>

                       <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-emerald-400 transition-all cursor-pointer">
                           <p className="text-emerald-600 font-medium">Click to browse files</p>
                           <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG supported</p>
                       </div>
                       
                       <div className="space-y-3">
                           <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                               <FileCheck className="h-5 w-5 text-emerald-600" />
                               <span className="text-sm font-medium">Standard_Lease_Agreement.pdf</span>
                               <span className="text-xs text-slate-400 ml-auto">System Generated</span>
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
                            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <KeyRound className="h-10 w-10 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready for Handover</h3>
                            <p className="text-slate-600 max-w-md mx-auto">
                                By clicking complete, you confirm that physical keys have been handed over to <strong>{studentName}</strong> and the room inspection is satisfactory.
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
                   <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                       Next Step
                       <ChevronRight className="h-4 w-4 ml-2" />
                   </Button>
               ) : (
                   <Button onClick={handleComplete} className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px]" disabled={processCheckIn.isPending}>
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
