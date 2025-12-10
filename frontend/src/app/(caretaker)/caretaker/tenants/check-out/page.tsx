'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CheckCircle2, AlertTriangle, Upload, Plus, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const STEPS = ['Student Details', 'Room Inspection', 'Damage Report', 'Confirmation'];

interface DamageItem {
  id: string;
  item: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
}

export default function Page() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [damages, setDamages] = React.useState<DamageItem[]>([]);
  const [formData, setFormData] = React.useState({
    studentName: '',
    roomNumber: '',
    photos: [] as File[],
    notes: '',
    keysReturned: false,
    roomClean: false,
  });

  const addDamage = () => {
    setDamages([...damages, {
      id: Date.now().toString(),
      item: '',
      description: '',
      severity: 'minor',
    }]);
  };

  const removeDamage = (id: string) => {
    setDamages(damages.filter(d => d.id !== id));
  };

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
      title: "Check-Out Complete",
      description: "Student has been successfully checked out.",
    });
    router.push('/caretaker/dashboard');
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Student Check-Out
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Process student check-out with room inspection and damage assessment
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
            {currentStep === 0 && 'Confirm student and room information'}
            {currentStep === 1 && 'Inspect the room and verify its condition'}
            {currentStep === 2 && 'Document any damages found during inspection'}
            {currentStep === 3 && 'Review all details and complete check-out'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Student Details */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-search">Search Student</Label>
                <Input
                  id="student-search"
                  placeholder="Enter student name or room number"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-number">Room Number</Label>
                <Input
                  id="room-number"
                  placeholder="Room number"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 1: Room Inspection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="keys"
                    checked={formData.keysReturned}
                    onCheckedChange={(checked) => setFormData({ ...formData, keysReturned: !!checked })}
                  />
                  <label htmlFor="keys" className="text-sm font-medium">
                    All keys returned
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="clean"
                    checked={formData.roomClean}
                    onCheckedChange={(checked) => setFormData({ ...formData, roomClean: !!checked })}
                  />
                  <label htmlFor="clean" className="text-sm font-medium">
                    Room is clean and tidy
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Room Condition Photos</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium mb-1">Click to upload photos</p>
                  <p className="text-xs text-muted-foreground">
                    Document final room condition
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
                  placeholder="General observations about room condition..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2: Damage Report */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {damages.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-3" />
                  <p className="font-medium mb-1">No Damages Reported</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    The room is in good condition with no damages found
                  </p>
                  <Button variant="outline" onClick={addDamage}>
                    <Plus className="mr-2 h-4 w-4" />
                    Report Damage
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {damages.map((damage, index) => (
                      <Card key={damage.id}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Damage Item #{index + 1}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDamage(damage.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            <div className="space-y-2">
                              <Label>Item</Label>
                              <Input placeholder="e.g., Window, Bed, Wall" />
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea placeholder="Describe the damage..." rows={2} />
                            </div>
                            <div className="space-y-2">
                              <Label>Severity</Label>
                              <div className="flex gap-2">
                                <Badge className="bg-blue-100 text-blue-800 cursor-pointer">Minor</Badge>
                                <Badge className="bg-amber-100 text-amber-800 cursor-pointer">Moderate</Badge>
                                <Badge className="bg-red-100 text-red-800 cursor-pointer">Severe</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Button variant="outline" onClick={addDamage} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Damage
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Student:</span>
                  <span className="text-sm">{formData.studentName || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Room Number:</span>
                  <span className="text-sm">{formData.roomNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Keys Returned:</span>
                  <Badge variant={formData.keysReturned ? 'default' : 'secondary'}>
                    {formData.keysReturned ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Room Clean:</span>
                  <Badge variant={formData.roomClean ? 'default' : 'secondary'}>
                    {formData.roomClean ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Damages Reported:</span>
                  <Badge variant={damages.length > 0 ? 'destructive' : 'default'}>
                    {damages.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Photos Uploaded:</span>
                  <span className="text-sm">{formData.photos.length}</span>
                </div>
              </div>
              
              {damages.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Damages Reported
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-200">
                        {damages.length} damage{damages.length !== 1 ? 's have' : ' has'} been reported. Student will be notified and charges may apply.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
            Complete Check-Out
          </Button>
        )}
      </div>
    </div>
  );
}
