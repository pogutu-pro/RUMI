'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { 
  CheckCircle2, 
  User, 
  Home, 
  Camera, 
  ArrowRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Steps } from '@/components/ui/steps'; // Assuming this exists or I'll create a simple one
import { useToast } from '@/hooks/use-toast';
import { verifyBookingCode, processCheckIn, uploadCheckInPhotos } from '@/features/caretaker';
import { useMutation } from '@tanstack/react-query';

const checkInSchema = z.object({
  bookingCode: z.string().min(6, 'Booking code must be at least 6 characters'),
  studentId: z.string().min(1, 'Student ID is required'),
  roomId: z.string().min(1, 'Room assignment is required'),
  bedNumber: z.string().optional(),
  notes: z.string().optional(),
  photos: z.any().optional(), // FileList
});

type CheckInFormData = z.infer<typeof checkInSchema>;

import { use } from 'react';

export default function Page({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = React.useState(1);
  const [verifiedBooking, setVerifiedBooking] = React.useState<any>(null);
  const [uploadedPhotos, setUploadedPhotos] = React.useState<File[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      bookingCode: bookingId !== 'new' ? bookingId : '',
    }
  });

  const verifyMutation = useMutation({
    mutationFn: verifyBookingCode,
    onSuccess: (data) => {
      if (data.isValid) {
        setVerifiedBooking(data);
        setValue('studentId', data.studentName || ''); // Using name as ID for mock if needed
        setValue('roomId', data.roomNumber || '');
        setStep(2);
      } else {
        toast({
          title: "Invalid Booking",
          description: data.error || "Could not verify this booking code.",
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "Verification Failed",
        description: "An error occurred while verifying the booking.",
        variant: "destructive"
      });
    }
  });

  const checkInMutation = useMutation({
    mutationFn: async (data: CheckInFormData) => {
      let photoUrls: string[] = [];
      if (uploadedPhotos.length > 0) {
        photoUrls = await uploadCheckInPhotos(uploadedPhotos);
      }
      
      await processCheckIn({
        tenantId: data.studentId, // In real app this would be ID
        bookingCode: data.bookingCode,
        roomId: data.roomId, // In real app this would be ID
        bedNumber: data.bedNumber,
        actualCheckInDate: new Date().toISOString(),
        identityVerified: true,
        bookingVerified: true,
        photoProof: photoUrls,
        notes: data.notes,
        processedBy: 'current-user-id', // Should come from auth context
        processedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      setStep(4); // Success step
      toast({
        title: "Check-In Complete",
        description: "Student has been successfully checked in.",
      });
    },
    onError: () => {
      toast({
        title: "Check-In Failed",
        description: "Could not complete the check-in process.",
        variant: "destructive"
      });
    }
  });

  const handleVerify = () => {
    const code = watch('bookingCode');
    if (code) verifyMutation.mutate(code);
  };

  const onSubmit = (data: CheckInFormData) => {
    checkInMutation.mutate(data);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedPhotos(Array.from(e.target.files));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Student Check-In
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Process new student arrival and room assignment
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10 -translate-y-1/2" />
        {[1, 2, 3].map((s) => (
          <div key={s} className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors bg-background border-2",
            step >= s ? "border-primary text-primary" : "border-muted text-muted-foreground",
            step > s && "bg-primary text-primary-foreground border-primary"
          )}>
            {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Verify Booking"}
            {step === 2 && "Room Assignment & Details"}
            {step === 3 && "Documentation"}
            {step === 4 && "Complete"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Enter the booking code provided by the student"}
            {step === 2 && "Confirm room allocation and student details"}
            {step === 3 && "Upload photos of room condition and add notes"}
            {step === 4 && "Check-in processed successfully"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookingCode">Booking Code</Label>
                <div className="flex gap-2">
                  <Input 
                    id="bookingCode" 
                    placeholder="e.g. BK-123456" 
                    {...register('bookingCode')}
                  />
                  <Button 
                    onClick={handleVerify} 
                    disabled={verifyMutation.isPending || !watch('bookingCode')}
                  >
                    {verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify
                  </Button>
                </div>
                {errors.bookingCode && (
                  <p className="text-sm text-red-500">{errors.bookingCode.message}</p>
                )}
              </div>
            </div>
          )}

          {step === 2 && verifiedBooking && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <User className="h-4 w-4" />
                  Student: {verifiedBooking.studentName}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Home className="h-4 w-4" />
                  Assigned Room: {verifiedBooking.roomNumber}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="roomId">Confirm Room</Label>
                  <Input 
                    id="roomId" 
                    {...register('roomId')}
                    defaultValue={verifiedBooking.roomNumber}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedNumber">Bed Number (Optional)</Label>
                  <Input 
                    id="bedNumber" 
                    {...register('bedNumber')}
                    placeholder="e.g. A, B, 1, 2"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Room Condition Photos</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handlePhotoUpload}
                  />
                  <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload photos</p>
                  <p className="text-xs text-muted-foreground">
                    {uploadedPhotos.length > 0 
                      ? `${uploadedPhotos.length} photos selected` 
                      : "Document initial room state"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Check-In Notes</Label>
                <Textarea 
                  id="notes" 
                  {...register('notes')}
                  placeholder="Any observations or specific items handed over..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Welcome to RUMI!</h3>
              <p className="text-muted-foreground mb-6">
                Check-in has been successfully recorded. The student has been notified.
              </p>
              <Button onClick={() => router.push('/caretaker/hostel')}>
                Return to Dashboard
              </Button>
            </div>
          )}
        </CardContent>

        {step < 4 && (
          <CardFooter className="flex justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Back
            </Button>
            
            {step === 1 && (
              <Button disabled>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === 2 && (
              <Button onClick={() => setStep(3)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === 3 && (
              <Button 
                onClick={handleSubmit(onSubmit)}
                disabled={checkInMutation.isPending}
              >
                {checkInMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Check-In
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
