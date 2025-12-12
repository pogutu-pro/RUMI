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
  AlertTriangle,
  Search
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { processCheckOut, uploadCheckOutPhotos, getTenant } from '@/features/caretaker';
import { useMutation, useQuery } from '@tanstack/react-query';

const checkOutSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  reason: z.enum(['semester_end', 'transfer', 'graduation', 'voluntary', 'eviction', 'other']),
  reasonDetails: z.string().optional(),
  roomCondition: z.enum(['clean', 'needs_cleaning', 'damaged']),
  notes: z.string().optional(),
  photos: z.any().optional(),
});

type CheckOutFormData = z.infer<typeof checkOutSchema>;

import { use } from 'react';

export default function Page({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = React.useState(1);
  const [uploadedPhotos, setUploadedPhotos] = React.useState<File[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');

  // If params.bookingId is not 'new', assume it's a tenant ID for now
  const tenantId = bookingId !== 'new' ? bookingId : undefined;

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CheckOutFormData>({
    resolver: zodResolver(checkOutSchema),
    defaultValues: {
      tenantId: tenantId || '',
      reason: 'semester_end',
      roomCondition: 'clean',
    }
  });

  // Mock tenant search/fetch
  const { data: tenant, isLoading: isLoadingTenant } = useQuery({
    queryKey: ['tenant', watch('tenantId')],
    queryFn: () => getTenant(watch('tenantId')),
    enabled: !!watch('tenantId') && step === 1,
    retry: false
  });

  const checkOutMutation = useMutation({
    mutationFn: async (data: CheckOutFormData) => {
      let photoUrls: string[] = [];
      if (uploadedPhotos.length > 0) {
        photoUrls = await uploadCheckOutPhotos(uploadedPhotos);
      }
      
      await processCheckOut({
        tenantId: data.tenantId,
        roomId: tenant?.roomId || 'unknown', // Should come from tenant data
        actualCheckOutDate: new Date().toISOString(),
        reason: data.reason,
        reasonDetails: data.reasonDetails,
        roomCondition: data.roomCondition,
        photoProof: photoUrls,
        notes: data.notes,
        processedBy: 'current-user-id',
        processedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      setStep(4);
      toast({
        title: "Check-Out Complete",
        description: "Student check-out has been processed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Check-Out Failed",
        description: "Could not complete the check-out process.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CheckOutFormData) => {
    checkOutMutation.mutate(data);
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
          Student Check-Out
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Process student departure and room inspection
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
            {step === 1 && "Identify Tenant"}
            {step === 2 && "Room Assessment"}
            {step === 3 && "Documentation"}
            {step === 4 && "Complete"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Select the student checking out"}
            {step === 2 && "Assess room condition and damages"}
            {step === 3 && "Upload photos and final notes"}
            {step === 4 && "Check-out processed successfully"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Student ID or Name</Label>
                <div className="flex gap-2">
                  <Input 
                    id="tenantId" 
                    placeholder="Enter Student ID" 
                    {...register('tenantId')}
                  />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {errors.tenantId && (
                  <p className="text-sm text-red-500">{errors.tenantId.message}</p>
                )}
              </div>

              {tenant && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4" />
                    {tenant.first_name} {tenant.last_name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Home className="h-4 w-4" />
                    Room {tenant.roomNumber}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Reason for Leaving</Label>
                  <Select 
                    onValueChange={(val) => setValue('reason', val as any)}
                    defaultValue={watch('reason')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semester_end">End of Semester</SelectItem>
                      <SelectItem value="graduation">Graduation</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="voluntary">Voluntary Move-out</SelectItem>
                      <SelectItem value="eviction">Eviction</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Room Condition</Label>
                  <Select 
                    onValueChange={(val) => setValue('roomCondition', val as any)}
                    defaultValue={watch('roomCondition')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean">Clean & Good</SelectItem>
                      <SelectItem value="needs_cleaning">Needs Cleaning</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {watch('roomCondition') === 'damaged' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm flex gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p>
                    Please ensure you document all damages thoroughly in the next step with photos.
                    A damage report will be automatically generated.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reasonDetails">Additional Details (Optional)</Label>
                <Textarea 
                  id="reasonDetails" 
                  {...register('reasonDetails')}
                  placeholder="Specific details about the departure..."
                />
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
                      : "Document final room state"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Final Notes</Label>
                <Textarea 
                  id="notes" 
                  {...register('notes')}
                  placeholder="Any final observations, key return status, etc..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Check-Out Processed</h3>
              <p className="text-muted-foreground mb-6">
                The student has been successfully checked out. Room status has been updated.
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
              <Button 
                onClick={() => setStep(2)}
                disabled={!watch('tenantId')}
              >
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
                disabled={checkOutMutation.isPending}
              >
                {checkOutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Check-Out
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}
