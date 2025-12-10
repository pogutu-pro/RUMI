'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CheckCircle2, User, Home, AlertCircle, Upload } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const STEPS = ['Verify Booking', 'Student Details', 'Room Inspection', 'Confirmation'];

export default function Page() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    bookingCode: '',
    studentName: '',
    studentId: '',
    roomNumber: '',
    photos: [] as File[],
    notes: '',
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    toast({
      title: "Check-In Complete",
      description: "Student has been successfully checked in.",
    });
    router.push('/caretaker/dashboard');
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Student Check-In
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Process student check-in with room inspection and photo documentation
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Step {currentStep + 1} of {STEPS.length}</span>
              <span className="text-muted-foreground">{STEPS[currentStep]}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {STEPS.map((step, index) => (
                <div key={step} className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    index <= currentStep 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-muted bg-muted text-muted-foreground'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep]}</CardTitle>
          <CardDescription>
            {currentStep === 0 && 'Enter and verify the student\'s booking code'}
            {currentStep === 1 && 'Confirm student information and assign room'}
            {currentStep === 2 && 'Inspect the room and document its condition'}
            {currentStep === 3 && 'Review all details and complete check-in'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Verify Booking */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="booking-code">Booking Code</Label>
                <Input
                  id="booking-code"
                  placeholder="Enter booking code (e.g., BK-2024-001)"
                  value={formData.bookingCode}
                  onChange={(e) => setFormData({ ...formData, bookingCode: e.target.value })}
                />
              </div>
              <Button className="w-full">
                Verify Booking
              </Button>
            </div>
          )}

          {/* Step 1: Student Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="student-name">Student Name</Label>
                  <Input
                    id="student-name"
                    placeholder="Full name"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-id">Student ID</Label>
                  <Input
                    id="student-id"
                    placeholder="ID number"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-number">Assigned Room</Label>
                <Input
                  id="room-number"
                  placeholder="Room number"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2: Room Inspection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Room Condition Photos</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium mb-1">Click to upload photos</p>
                  <p className="text-xs text-muted-foreground">
                    Take photos of room condition, furniture, and important items
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setFormData({ ...formData, photos: Array.from(e.target.files) });
                      }
                    }}
                  />
                </div>
                {formData.photos.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {formData.photos.length} {formData.photos.length === 1 ? 'photo' : 'photos'} selected
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspection-notes">Inspection Notes</Label>
                <Textarea
                  id="inspection-notes"
                  placeholder="Document room condition, any existing damage, or special notes..."
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Booking Code:</span>
                  <Badge variant="outline">{formData.bookingCode || 'N/A'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Student Name:</span>
                  <span className="text-sm">{formData.studentName || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Student ID:</span>
                  <span className="text-sm">{formData.studentId || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Room Number:</span>
                  <span className="text-sm">{formData.roomNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Photos Uploaded:</span>
                  <span className="text-sm">{formData.photos.length}</span>
                </div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Ready to Complete Check-In
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-200">
                      Please review all information before confirming. Once completed, the student will receive a confirmation notification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            Complete Check-In
          </Button>
        )}
      </div>
    </div>
  );
}
