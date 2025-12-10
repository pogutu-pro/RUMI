'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  RoomTransferCard,
  ReasonSelector,
  PriceDifferenceIndicator,
} from '@/components/transfers';
import { useTransferStore } from '@/stores/transfer.store';
import { getAvailableRooms, createTransferRequest, getTransferPolicy } from '@/lib/api/transfers';
import { TransferReason, AvailableRoom } from '@/types/entities.types';

export default function CreateTransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRoomId = searchParams.get('roomId');

  const {
    currentStep,
    draftTransfer,
    updateDraftTransfer,
    resetDraftTransfer,
    nextStep,
    prevStep,
    setCurrentStep,
    currentPolicy,
    setTransferPolicy,
  } = useTransferStore();

  const [availableRooms, setAvailableRooms] = React.useState<AvailableRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = React.useState<AvailableRoom | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successSubmitted, setSuccessSubmitted] = React.useState(false);

  // Fetch data on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [rooms, policy] = await Promise.all([
          getAvailableRooms('default-hostel'),
          getTransferPolicy('default-hostel'),
        ]);
        setAvailableRooms(rooms);
        setTransferPolicy(policy);

        // Pre-select room if provided
        if (preselectedRoomId) {
          const room = rooms.find((r) => r.id === preselectedRoomId);
          if (room) {
            setSelectedRoom(room);
            updateDraftTransfer({ toRoomId: room.id });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [preselectedRoomId, updateDraftTransfer, setTransferPolicy]);

  const handleRoomSelect = (room: AvailableRoom) => {
    setSelectedRoom(room);
    updateDraftTransfer({ toRoomId: room.id });
    nextStep();
  };

  const handleReasonSubmit = () => {
    if (draftTransfer.reason && (draftTransfer.reason !== 'other' || draftTransfer.reasonDetails.length >= 10)) {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    if (!selectedRoom || !draftTransfer.reason || !draftTransfer.transferDate) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransferRequest('default-hostel', {
        bookingId: 'booking-123', // TODO: Get from user context
        fromRoomId: 'current-room-id', // TODO: Get from user context
        toRoomId: selectedRoom.id,
        reason: draftTransfer.reason,
        reasonDetails: draftTransfer.reasonDetails,
        transferDate: draftTransfer.transferDate,
      });

      setSuccessSubmitted(true);
      resetDraftTransfer();
    } catch (error) {
      console.error('Error submitting transfer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / 3) * 100;

  // Success Screen
  if (successSubmitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Transfer Request Submitted!
            </h2>
            <p className="text-center text-muted-foreground max-w-md mb-8">
              Your transfer request has been submitted successfully. You'll be
              notified once the admin reviews your request.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/student/transfers')}
              >
                View My Transfers
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => router.push('/student/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Request Room Transfer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Follow the steps to submit your transfer request
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Step {currentStep} of 3
          </span>
          <span className="text-muted-foreground">{progressPercentage.toFixed(0)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className={currentStep >= 1 ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}>
            Select Room
          </span>
          <span className={currentStep >= 2 ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}>
            Reason
          </span>
          <span className={currentStep >= 3 ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}>
            Review
          </span>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Select Your New Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableRooms.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No rooms available for transfer
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRooms.slice(0, 6).map((room) => (
                    <RoomTransferCard
                      key={room.id}
                      room={room}
                      onRequestTransfer={() => handleRoomSelect(room)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Tell Us Why You Want to Transfer</CardTitle>
            </CardHeader>
            <CardContent>
              <ReasonSelector
                value={draftTransfer.reason}
                onValueChange={(reason) => updateDraftTransfer({ reason })}
                reasonDetails={draftTransfer.reasonDetails}
                onReasonDetailsChange={(details) =>
                  updateDraftTransfer({ reasonDetails: details })
                }
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleReasonSubmit}
              disabled={
                !draftTransfer.reason ||
                (draftTransfer.reason === 'other' && draftTransfer.reasonDetails.length < 10)
              }
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && selectedRoom && (
        <div className="space-y-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Review Your Transfer Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Room Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">From (Current)</Label>
                  <div className="mt-2 p-4 rounded-lg border bg-muted">
                    <p className="font-semibold text-foreground">Room 201</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      KES 12,000/month
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">To (Requested)</Label>
                  <div className="mt-2 p-4 rounded-lg border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                    <p className="font-semibold text-foreground">
                      Room {selectedRoom.roomNumber}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      KES {selectedRoom.currentPrice.toLocaleString()}/month
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Difference */}
              <div>
                <Label className="text-muted-foreground mb-3 block">
                  Price Adjustment
                </Label>
                <PriceDifferenceIndicator
                  oldPrice={12000}
                  newPrice={selectedRoom.currentPrice}
                />
              </div>

              {/* Transfer Date */}
              <div>
                <Label htmlFor="transferDate">
                  Preferred Transfer Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal mt-2',
                        !draftTransfer.transferDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {draftTransfer.transferDate ? (
                        format(draftTransfer.transferDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={draftTransfer.transferDate || undefined}
                      onSelect={(date) =>
                        updateDraftTransfer({ transferDate: date || null })
                      }
                      disabled={(date) =>
                        date < new Date() || date < new Date(new Date().setDate(new Date().getDate() + (currentPolicy?.minDaysNotice || 14)))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {currentPolicy && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Minimum {currentPolicy.minDaysNotice} days notice required
                  </p>
                )}
              </div>

              {/* Transfer Policy Summary */}
              {currentPolicy && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                  <h4 className="font-semibold text-foreground mb-2">
                    Transfer Policy
                  </h4>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li>• Transfer fee: KES {currentPolicy.transferFee.toLocaleString()}</li>
                    <li>• Average processing time: {currentPolicy.averageProcessingDays} business days</li>
                    {currentPolicy.requiresCaretakerApproval && (
                      <li>• Requires caretaker approval</li>
                    )}
                    {currentPolicy.additionalRules && (
                      <li>• {currentPolicy.additionalRules}</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSubmit}
              disabled={!draftTransfer.transferDate || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Submit Transfer Request
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
