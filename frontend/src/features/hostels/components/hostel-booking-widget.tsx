'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, AlertCircle, ChevronDown, Clock, ShieldCheck, CreditCard, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format, addMinutes, differenceInSeconds } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { 
  checkAvailability, 
  createBookingWithValidation, 
  confirmPayment,
  checkStudentProfileExists 
} from '@/features/bookings';
import { toggleFavoriteHostel, hostelsApi } from '@/features/hostels';
import { useAuth } from '@/features/auth';
import { useBookingStore } from '@/features/bookings';
import RoomAvailabilityCalendar from './room-availability-calendar';
import ProfileCheckModal from './profile-check-modal';
import PaymentInstructionsModal from './payment-instructions-modal';
import RoomSelectionCard from './room-selection-card';
import BookingSuccessView from './booking-success-view';
import BookingModeSelector from './booking-mode-selector';
import type { Hostel } from '@/types/entities.types';

interface HostelBookingWidgetProps {
  hostel: Hostel;
  className?: string;
  basePath?: string;
}

export function HostelBookingWidget({
  hostel,
  className,
  basePath = '/hostels',
}: HostelBookingWidgetProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  // Global Booking State

  const {
    currentStep,
    isMobileSheetOpen,
    selectedRoomId,
    moveInDate,
    durationMonths,
    paymentTimerStartedAt,
    isPaymentVerified,
    bookingType,
    inviteCode,
    isBookingInProgress,
    setStep,
    setMobileSheetOpen,
    selectRoom,
    setMoveInDate,
    setDurationMonths,
    startPaymentTimer,
    resetBooking,
    setPaymentVerified,
    setBookingType,
    setInviteCode,
    setBookingInProgress,
  } = useBookingStore();

  // Local UI State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  // Derived State
  const safeMoveInDate = useMemo(() => {
    if (!moveInDate) return undefined;
    const date = new Date(moveInDate);
    return isNaN(date.getTime()) ? undefined : date;
  }, [moveInDate]);

  // Queries & Mutations
  const { data: roomsData, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['hostel-rooms', hostel.id],
    queryFn: () => hostelsApi.getRooms({ hostel: hostel.id }),
    staleTime: 5 * 60 * 1000,
  });

  const availableRooms = useMemo(
    () => roomsData?.data?.filter((room) => room.available) || [],
    [roomsData?.data],
  );

  const selectedRoom = useMemo(
    () => availableRooms.find((r) => String(r.id) === selectedRoomId) || null,
    [availableRooms, selectedRoomId],
  );

  const totalPrice = useMemo(() => {
    const basePrice = selectedRoom?.price || hostel.pricePerMonth || 0;
    return basePrice * durationMonths;
  }, [selectedRoom?.price, hostel.pricePerMonth, durationMonths]);

  // Timer Logic
  useEffect(() => {
    if (currentStep === 'payment' && paymentTimerStartedAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = differenceInSeconds(addMinutes(paymentTimerStartedAt, 15), now);
        
        if (diff <= 0) {
          setTimeLeft(0);
          clearInterval(interval);
          toast.error('Payment session expired. Please start again.');
          // Ideally, we'd release the hold here
        } else {
          setTimeLeft(diff);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep, paymentTimerStartedAt]);

  // Auto-Resume Logic after Login
  useEffect(() => {
    if (isAuthenticated && isBookingInProgress) {
      setIsResuming(true);
      // Small delay to ensure store rehydration and UI stability
      const timer = setTimeout(() => {
        if (selectedRoom && safeMoveInDate) {
          toast.info("Welcome back! Resuming your booking...", { duration: 3000 });
          setBookingInProgress(false);
          proceedToProfileCheck().finally(() => setIsResuming(false));
          // If on mobile, open the sheet
          setMobileSheetOpen(true);
        } else {
           setBookingInProgress(false);
           setIsResuming(false);
           toast.error("Could not resume booking: Details missing. Please select again.");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isBookingInProgress]);


  // Queries & Mutations
  const { data: availability, isLoading: isLoadingAvailability } = useQuery({
    queryKey: ['availability', hostel.id, safeMoveInDate?.toISOString()],
    queryFn: () => {
      if (!safeMoveInDate) throw new Error('No date selected');
      return checkAvailability(String(hostel.id), safeMoveInDate);
    },
    enabled: !!safeMoveInDate,
    retry: 1,
  });

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      // Small artificial delay for "processing" feel
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!safeMoveInDate || !selectedRoom) throw new Error('Please select date and room');
      return createBookingWithValidation({
        hostelId: hostel.id,
        roomId: selectedRoom.id,
        moveInDate: safeMoveInDate,
        durationMonths,
      });
    },
    onSuccess: async (data) => {
      setCurrentBookingId(data.id);
      setStep('payment');
      startPaymentTimer();
      
      // Generate invite code if needed
      if (bookingType === 'invite') {
        setInviteCode(`INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      }

      // Add to wishlist silently
      try {
        await toggleFavoriteHostel(String(hostel.id));
      } catch (error) {
        // Ignore wishlist errors
      }
    },
    onError: (error: Error) => {
      // Handle known error cases
      if (error.message.includes('profile')) {
          toast.error('Please complete your student profile first.');
          setIsProfileModalOpen(true);
      } else {
          toast.error(error.message || 'Booking failed. Please try again.');
      }
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!currentBookingId) throw new Error('No booking to confirm');
      return confirmPayment(currentBookingId);
    },
    onSuccess: () => {
      setPaymentVerified(true);
      setStep('success');
      toast.success('Payment confirmed! Welcome home.', {
        duration: 5000,
        icon: '🎉'
      });
    },
    onError: (error: any) => {
      // Robust handling for missing backend endpoint
      if (error.code === 'PENDING_VERIFICATION' || error.message.includes('pending')) {
         setPaymentVerified(true); // Allow proceeding in UI
         setStep('success');
         toast.success('Payment recorded! Waiting for confirmation.', {
             description: "You'll receive an SMS once our system verifies the transaction.",
             duration: 6000,
             icon: '⏳'
         });
         return;
      }
      toast.error(error.message || 'Payment verification failed. Please try again or contact support.');
    },
  });

  // Handlers
  const handleBookClick = async () => {
    // Validation
    if (!selectedRoom) {
      toast.warning('Please select a room first');
      return;
    }
    if (!safeMoveInDate) {
      toast.warning('Please select a move-in date');
      return;
    }

    // Auth Check
    if (!isAuthenticated) {
      toast.info('Please login to secure your slot', {
        description: "We'll save your spot while you sign in."
       });
      setBookingInProgress(true);
      router.push(`/login?redirect=${basePath}/${hostel.slug}`);
      return;
    }

    // Check if shared room logic is needed
    if (selectedRoom.capacity > 1) {
      setIsModeSelectorOpen(true);
      return;
    }

    // If private room, proceed directly
    setBookingType('solo');
    proceedToProfileCheck();
  };

  const handleModeSelect = (mode: 'solo' | 'invite') => {
    setBookingType(mode);
    setIsModeSelectorOpen(false);
    proceedToProfileCheck();
  };

  const proceedToProfileCheck = async () => {
    try {
      const hasProfile = await checkStudentProfileExists();
      if (!hasProfile) {
        setIsProfileModalOpen(true);
        return;
      }
      createBookingMutation.mutate();
    } catch (error) {
      toast.error('Failed to verify profile. Please try again.');
    }
  };

  const copyInviteLink = () => {
    const link = `https://rumi.com/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success('Invite link copied!');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Components
  const SelectionView = () => (
    <div className="space-y-6">
      {/* Date & Duration */}
      {/* Date Selection Only - Duration removed as per requirements */}
      <div className="grid grid-cols-1 gap-3">
        <div className="col-span-1">
          <Label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">Move-in Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11", !safeMoveInDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {safeMoveInDate ? format(safeMoveInDate, 'dd MMM yyyy') : <span>Select date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <RoomAvailabilityCalendar
                bookedDates={availability?.bookedDates || []}
                onDateSelect={setMoveInDate}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Room Selection */}
      <div>
        <Label className="text-xs font-bold uppercase text-slate-500 mb-3 block">Choose Your Room</Label>
        {isLoadingRooms ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {availableRooms.map((room) => (
              <RoomSelectionCard
                key={room.id}
                room={room}
                isSelected={selectedRoomId === String(room.id)}
                onSelect={(roomId) => selectRoom(roomId)}
                pricePerMonth={room.price}
              />
            ))}
            {availableRooms.length === 0 && (
               <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                 No rooms available for booking right now.
               </div>
            )}
          </div>
        )}
      </div>

      {/* Details Sections */}
      <Accordion type="single" collapsible className="w-full" defaultValue="cost-breakdown">
        {/* Cost Breakdown */}
        {selectedRoom ? (
          <AccordionItem value="cost-breakdown" className="border-b-0">
            <AccordionTrigger className="py-2 text-sm font-bold text-slate-900 hover:no-underline">
              Cost Breakdown
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>First Month Rent</span>
                  <span>KSh {totalPrice.toLocaleString()}</span>
                </div>
                
                {/* Mock Deposit - In real app, this comes from backend */}
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Security Deposit (Refundable)</span>
                  <span>KSh 2,000</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-500 font-medium uppercase block">Payable Today</span>
                    <span className="text-lg font-bold text-emerald-600">KSh {(totalPrice + 2000).toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-medium uppercase block">Recurring</span>
                    <span className="text-sm font-bold text-slate-900">KSh {(selectedRoom.price || hostel.pricePerMonth || 0).toLocaleString()}/mo</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : (
             <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center text-sm text-slate-500">
                Select a room to see cost breakdown.
             </div>
        )}

        {/* Business Logic Highlights */}
        <AccordionItem value="booking-policies" className="border-b-0">
           <AccordionTrigger className="py-2 text-sm font-bold text-slate-900 hover:no-underline">
              Booking Policies & Benefits
           </AccordionTrigger>
           <AccordionContent>
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs text-slate-600 border border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Secure your spot with <strong>KSh 2,000 deposit</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>15-minute payment window to prevent holding</span>
                </div>
                {selectedRoom && selectedRoom.capacity > 1 && (
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-600" />
                    <span>Split payment available for roommates</span>
                  </div>
                )}
              </div>
           </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Action Button */}
      <Button
        className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all active:scale-[0.98]"
        onClick={handleBookClick}
        disabled={createBookingMutation.isPending || isResuming}
        size="lg"
      >
        {createBookingMutation.isPending || isResuming ? 'Processing...' : 'Book This Room'}
      </Button>
      
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-3 h-3" />
        <span>Secure booking • Instant confirmation</span>
      </div>
    </div>
  );

  const PaymentView = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900 text-sm">Complete payment in {timeLeft !== null ? formatTime(timeLeft) : '--:--'}</h4>
          <p className="text-xs text-amber-700 mt-1">
            Your slot in {selectedRoom?.name} is held for 15 minutes.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 border border-slate-200 rounded-xl bg-white">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment Details
          </h4>
          
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500 uppercase font-bold">Paybill Number</Label>
              <div className="text-lg font-mono font-bold text-slate-900">{hostel.landlord_phone || '247247'}</div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 uppercase font-bold">Account Number</Label>
              <div className="text-lg font-mono font-bold text-slate-900">{selectedRoom?.name || 'ROOM-01'}</div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 uppercase font-bold">Amount to Pay</Label>
              <div className="text-xl font-bold text-emerald-600">KSh {(totalPrice + 2000).toLocaleString()}</div>
              {bookingType === 'invite' && (
                <p className="text-xs text-slate-500 mt-1">Paying for your slot only. Your friend will pay separately.</p>
              )}
            </div>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            After paying via M-Pesa, wait for the confirmation SMS then click the button below.
          </AlertDescription>
        </Alert>

        <Button
          className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
          onClick={() => confirmPaymentMutation.mutate()}
          disabled={confirmPaymentMutation.isPending}
        >
          {confirmPaymentMutation.isPending ? 'Verifying Payment...' : "I've Paid"}
        </Button>
        
        <Button
          variant="ghost"
          className="w-full text-sm text-slate-500"
          onClick={() => setStep('selection')}
        >
          Cancel Booking
        </Button>
      </div>
    </div>
  );

  // Main Render
  if (currentStep === 'success' && selectedRoom && safeMoveInDate) {
    return (
      <div className="space-y-6">
        <BookingSuccessView
          bookingId={currentBookingId || '---'}
          hostelName={hostel.name}
          roomName={selectedRoom.name}
          moveInDate={safeMoveInDate}
          amountPaid={totalPrice + 2000}
        />
        
        {bookingType === 'invite' && inviteCode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Invite your roommate!</h3>
            <p className="text-sm text-slate-600 mb-4">
              Share this link with your friend. They have 15 minutes to pay for their slot to secure the room.
            </p>
            
            <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg mb-4">
              <code className="flex-1 font-mono text-sm text-slate-600 truncate">
                https://rumi.com/join/{inviteCode}
              </code>
              <Button size="sm" variant="ghost" onClick={copyInviteLink}>
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-100">
              Share via WhatsApp
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  const WidgetContent = () => (
    <>
      <div className="mb-6 relative">
        <h3 className="text-xl font-bold text-slate-900">
          {currentStep === 'payment' ? 'Confirm & Pay' : 'Book your stay'}
        </h3>
        {currentStep === 'selection' && (
          <p className="text-sm text-slate-500 mt-1">
            <span className="font-bold text-slate-900">KSh {((hostel?.pricePerMonth ?? 0) || 0).toLocaleString()}</span>
            /month
          </p>
        )}
        
        {/* Loading Overlay */}
        <AnimatePresence>
            {isResuming && (
                <div 
                    className="absolute inset-0 bg-white z-10 flex items-center justify-center rounded-xl border border-emerald-100"
                >
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
                        <span className="text-sm font-medium text-emerald-700 font-bold uppercase tracking-tight">Processing...</span>
                    </div>
                </div>
            )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 'payment' ? (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PaymentView />
          </motion.div>
        ) : (
          <motion.div
            key="selection"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <SelectionView />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <>
      {/* Desktop Sticky Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'hidden lg:block sticky top-24 self-start p-6 border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden',
          className,
        )}
      >
        <WidgetContent />
      </motion.div>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-100 p-4 shadow-none z-40 safe-area-bottom">
        <div className="container mx-auto">
          <div className="flex justify-between items-center gap-4">
            <div className="flex flex-col">
              <span className="font-bold text-slate-900">
                KSh {((hostel?.pricePerMonth ?? 0) || 0).toLocaleString()}
                <span className="text-sm font-normal text-slate-500"> / mo</span>
              </span>
              <span className="text-xs text-slate-500">
                 {selectedRoom ? selectedRoom.name : 'Select a room'}
              </span>
            </div>
            <Sheet open={isMobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button size="lg" className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
                  Book Now
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
                <SheetHeader className="sr-only">
                  <SheetTitle>Book your stay</SheetTitle>
                  <SheetDescription>
                    Select your preferred room and move-in date to complete your booking.
                  </SheetDescription>
                </SheetHeader>
                <div className="pt-6">
                  <WidgetContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Profile Check Modal */}
      <ProfileCheckModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onCreateProfile={() => router.push('/student/profile')}
        hostelName={hostel.name}
      />

      {/* Booking Mode Selector */}
      <BookingModeSelector
        isOpen={isModeSelectorOpen}
        onClose={() => setIsModeSelectorOpen(false)}
        onSelectMode={handleModeSelect}
        price={totalPrice}
      />
    </>
  );
}
