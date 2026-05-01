"use client";

import * as React from 'react';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Home,
  BedDouble,
  CreditCard,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  X,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useCreateHostel, HostelImageUpload, EnhancedHostelImageUpload } from '@/features/hostels';

// ============================================================================
// WIZARD TYPES
// ============================================================================

interface HostelFormData {
  // Step 1: Basic Info
  name: string;
  description: string;
  campus: string;
  town: string;
  genderPolicy: 'male_only' | 'female_only' | 'mixed' | '';
  tenantType: 'students_only' | 'anyone' | '';
  
  // Step 2: Building Structure
  totalFloors: number;
  totalRooms: number;
  caretakerName: string;
  caretakerPhone: string;
  safetyFeatures: string[];
  
  // Step 3: Room Types
  roomTypes: {
    name: string;
    bedsPerRoom: number;
    genderRestriction: string;
    amenities: string[];
    monthlyRent: number;
  }[];
  
  // Step 6: Photos
  images: string[];
  imageFiles: File[];
  photoCategories: Record<number, string>;
  
  // Step 4: Pricing
  depositAmount: number;
  depositRefundable: boolean;
  registrationFee: number;
  paymentCycle: 'monthly' | 'semester' | 'annual';
  gracePeriod: number;
  lateFeePercent: number;
  
  // Step 5: Rules
  minimumStay: 'semester' | 'year' | 'flexible';
  midTermJoins: boolean;
  houseRules: string;
  termsAgreed: boolean;
}

const initialFormData: HostelFormData = {
  name: '',
  description: '',
  campus: '',
  town: '',
  genderPolicy: '',
  tenantType: '',
  totalFloors: 1,
  totalRooms: 1,
  caretakerName: '',
  caretakerPhone: '',
  safetyFeatures: [],
  roomTypes: [{
    name: '',
    bedsPerRoom: 1,
    genderRestriction: '',
    amenities: [],
    monthlyRent: 0
  }],
  images: [],
  imageFiles: [],
  photoCategories: {},
  depositAmount: 0,
  depositRefundable: true,
  registrationFee: 0,
  paymentCycle: 'monthly',
  gracePeriod: 5,
  lateFeePercent: 5,
  minimumStay: 'semester',
  midTermJoins: true,
  houseRules: '',
  termsAgreed: false,
};

// Campus options
const campusOptions = [
  { value: 'dekut', label: 'Dedan Kimathi University (DeKUT)' },
  { value: 'ku', label: 'Kenyatta University (KU)' },
  { value: 'uon', label: 'University of Nairobi (UoN)' },
  { value: 'jkuat', label: 'JKUAT' },
  { value: 'moi', label: 'Moi University' },
  { value: 'egerton', label: 'Egerton University' },
  { value: 'other', label: 'Other Institution' },
];

// Safety features
const safetyFeatureOptions = [
  { id: 'cctv', label: 'CCTV Cameras' },
  { id: 'security_guard', label: 'Security Guard (24/7)' },
  { id: 'fire_exits', label: 'Fire Exits' },
  { id: 'fire_extinguisher', label: 'Fire Extinguishers' },
  { id: 'curfew', label: 'Curfew Hours' },
  { id: 'visitor_rules', label: 'Visitor Registration' },
  { id: 'gated', label: 'Gated Compound' },
  { id: 'well_lit', label: 'Well Lit Areas' },
];

// Step definitions
const steps = [
  { id: 1, title: 'Basic Info', icon: Building2, description: 'Hostel name and location' },
  { id: 2, title: 'Structure', icon: Home, description: 'Rooms and safety' },
  { id: 3, title: 'Room Types', icon: BedDouble, description: 'Room setup' },
  { id: 4, title: 'Pricing', icon: CreditCard, description: 'Rent and fees' },
  { id: 5, title: 'Rules', icon: FileText, description: 'Terms and conditions' },
  { id: 6, title: 'Upload Photos', icon: Camera, description: '5-8 quality photos' },
];

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

export default function NewHostelWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<HostelFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const createHostel = useCreateHostel();

  // Calculate progress
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  // Update form data
  const updateField = useCallback(<K extends keyof HostelFormData>(
    field: K,
    value: HostelFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Toggle safety feature
  const toggleSafetyFeature = useCallback((featureId: string) => {
    setFormData(prev => ({
      ...prev,
      safetyFeatures: prev.safetyFeatures.includes(featureId)
        ? prev.safetyFeatures.filter(f => f !== featureId)
        : [...prev.safetyFeatures, featureId]
    }));
  }, []);

  // Validate current step
  const validateStep = useCallback((): { isValid: boolean; firstError?: string } => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Hostel name is required';
        if (!formData.campus) newErrors.campus = 'Please select a campus';
        if (!formData.town.trim()) newErrors.town = 'Town is required';
        if (!formData.genderPolicy) newErrors.genderPolicy = 'Please select a gender policy';
        if (!formData.tenantType) newErrors.tenantType = 'Please select who can rent';
        break;
      case 2:
        if (formData.totalRooms < 1) newErrors.totalRooms = 'Must have at least 1 room';
        if (!formData.caretakerName.trim()) newErrors.caretakerName = 'Caretaker name is required';
        if (!formData.caretakerPhone.trim()) newErrors.caretakerPhone = 'Caretaker phone is required';
        break;
      case 3:
        // Ensure at least basic room configuration is set
        if (!formData.roomTypes[0]?.bedsPerRoom || formData.roomTypes[0].bedsPerRoom < 1) {
          newErrors.bedsPerRoom = 'Please select beds per room';
        }
        if (!formData.roomTypes[0]?.monthlyRent || formData.roomTypes[0].monthlyRent < 1) {
          newErrors.monthlyRent = 'Please enter monthly rent amount';
        }
        break;
      case 4:
        if (formData.depositAmount < 0) newErrors.depositAmount = 'Deposit cannot be negative';
        break;
      case 5:
        if (!formData.termsAgreed) newErrors.termsAgreed = 'You must agree to the terms';
        break;
      case 6:
        // Photos - minimum 5 required
        if (formData.images.length < 5) {
          newErrors.images = 'Please upload at least 5 photos';
        }
        break;
    }

    setErrors(newErrors);
    const errorValues = Object.values(newErrors);
    return {
      isValid: errorValues.length === 0,
      firstError: errorValues[0]
    };
  }, [currentStep, formData]);

  // Handle next step
  const handleNext = useCallback(() => {
    const { isValid, firstError } = validateStep();
    if (isValid) {
      if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      toast.error(firstError || 'Please fill in all required fields');
    }
  }, [currentStep, validateStep]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Handle save draft
  const handleSaveDraft = useCallback(() => {
    localStorage.setItem('hostel_draft', JSON.stringify(formData));
    toast.success('Draft saved! You can continue later from your dashboard.');
    router.push('/landlord/hostels');
  }, [formData, router]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    // First validate the current step
    const { isValid, firstError } = validateStep();
    if (!isValid) {
      toast.error(firstError || 'Please fill in all required fields');
      return;
    }

    try {
      // Transform form data to API format
      // Determine hostel_type based on room configuration
      let hostelType = 'mixed'; // default
      if (formData.roomTypes.length > 0 && formData.roomTypes[0]?.bedsPerRoom) {
        const bedsPerRoom = formData.roomTypes[0].bedsPerRoom;
        if (bedsPerRoom === 1) {
          hostelType = 'single_rooms';
        } else if (bedsPerRoom > 1) {
          hostelType = 'shared_rooms';
        }
      }
      
      const apiData = {
        name: formData.name,
        description: formData.description,
        address: `${formData.town}, near ${campusOptions.find(c => c.value === formData.campus)?.label || formData.campus}`,
        city: formData.town, // Backend expects 'city' field
        university: campusOptions.find(c => c.value === formData.campus)?.label || formData.campus, // Map campus to university
        campus: formData.campus,
        gender_policy: formData.genderPolicy,
        hostel_type: hostelType, // Required field for backend
        tenant_type: formData.tenantType,
        total_rooms: formData.totalRooms,
        total_floors: formData.totalFloors,
        base_price: (formData.roomTypes[0]?.monthlyRent || 5000).toString(),
        deposit_amount: formData.depositAmount,
        caretaker_name: formData.caretakerName,
        caretaker_phone: formData.caretakerPhone,
        safety_features: formData.safetyFeatures,
        rules: formData.houseRules,
        minimum_stay: formData.minimumStay,
        mid_term_joins_allowed: formData.midTermJoins,
        payment_cycle: formData.paymentCycle,
        grace_period_days: formData.gracePeriod,
        late_fee_percent: formData.lateFeePercent,
        images: formData.images, // Image URLs/previews
      };

      const newHostel = await createHostel.mutateAsync(apiData as any);
      
      // Auto-generate rooms
      if (newHostel?.id && formData.totalRooms > 0) {
        toast.loading(`Creating hostel and generating ${formData.totalRooms} rooms...`, { id: 'create-hostel' });
        
        const roomType = formData.roomTypes[0] || initialFormData.roomTypes[0];
        let roomTypeEnum = 'mixed';
        if (roomType.bedsPerRoom === 1) roomTypeEnum = 'single_rooms';
        else if (roomType.bedsPerRoom > 1) roomTypeEnum = 'shared_rooms';

        // Cap auto-generation at 30 to prevent abuse/timeouts
        const roomsToGenerate = Math.min(formData.totalRooms, 30);
        
        try {
          const { hostelsApi } = await import('@/features/hostels');
          const roomPromises = [];
          for (let i = 1; i <= roomsToGenerate; i++) {
            roomPromises.push(
               hostelsApi.createRoom(String(newHostel.id), {
                 room_number: `Room ${i}`,
                 capacity: roomType.bedsPerRoom || 1,
                 base_price: String(roomType.monthlyRent || 5000),
                 room_type: roomTypeEnum as any
               })
            );
          }
          await Promise.all(roomPromises);
          
          if (formData.totalRooms > 30) {
            toast.success(`Hostel created! First 30 rooms auto-generated. Please add the rest manually.`, { id: 'create-hostel' });
          } else {
            toast.success('Hostel and all rooms created successfully!', { id: 'create-hostel' });
          }
        } catch (err) {
          console.error('Failed to auto-generate some rooms:', err);
          toast.error('Hostel created, but failed to auto-generate rooms. You can add them manually.', { id: 'create-hostel' });
        }
      } else {
        toast.success('Hostel created successfully!', { id: 'create-hostel' });
      }
      
      // Clear draft on success
      localStorage.removeItem('hostel_draft');
      router.push('/landlord/hostels');
    } catch (error: any) {
      // Show specific error messages
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create hostel';
      toast.error(errorMessage, { id: 'create-hostel' });
      console.error('Hostel creation error:', error);
    }
  }, [formData, validateStep, createHostel, router]);

  // Load draft on mount
  React.useEffect(() => {
    const draft = localStorage.getItem('hostel_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData({ ...initialFormData, ...parsed });
        toast.info('Draft restored! Continue where you left off.');
      } catch {
        // Invalid draft, ignore
      }
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Add New Hostel
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            Fill in the details step by step
          </p>
        </div>
        <Button variant="ghost" size="lg" asChild>
          <Link href="/landlord/hostels">
            <X className="h-5 w-5 mr-2" />
            Cancel
          </Link>
        </Button>
      </div>

      {/* Progress Bar */}
      <Card className="border shadow-sm bg-card">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-muted-foreground">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm font-bold text-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-6">
            {steps.map((step) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center text-center",
                    "flex-1"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all",
                      isCompleted && "bg-primary text-primary-foreground",
                      isActive && "bg-primary/20 text-primary border-2 border-primary",
                      !isCompleted && !isActive && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 md:h-6 md:w-6" />
                    ) : (
                      <StepIcon className="h-5 w-5 md:h-6 md:w-6" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs md:text-sm font-medium mt-2 hidden md:block",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card className="border shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-foreground">
            {steps[currentStep - 1].title}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {steps[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-bold">
                  Hostel Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Sunrise Hostels"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={cn("h-12 text-base", errors.name && "border-red-500")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  This name will be shown to students searching for hostels
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-bold">
                  Short Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Secure, furnished hostel for DeKUT students. Close to campus with 24/7 security."
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="min-h-[100px] text-base"
                />
                <p className="text-sm text-muted-foreground">
                  Describe what makes your hostel special (optional)
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base font-bold">Campus/Institution *</Label>
                  <Select
                    value={formData.campus}
                    onValueChange={(value) => updateField('campus', value)}
                  >
                    <SelectTrigger className={cn("h-12 text-base", errors.campus && "border-red-500")}>
                      <SelectValue placeholder="Select a campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {campusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-base">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.campus && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.campus}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="town" className="text-base font-bold">
                    Town *
                  </Label>
                  <Input
                    id="town"
                    placeholder="e.g., Nyeri"
                    value={formData.town}
                    onChange={(e) => updateField('town', e.target.value)}
                    className={cn("h-12 text-base", errors.town && "border-red-500")}
                  />
                  {errors.town && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.town}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-bold">Gender Policy *</Label>
                <RadioGroup
                  value={formData.genderPolicy}
                  onValueChange={(value) => updateField('genderPolicy', value as any)}
                  className="grid gap-4 md:grid-cols-3"
                >
                  {[
                    { value: 'male_only', label: 'Male Only', desc: 'Only male students' },
                    { value: 'female_only', label: 'Female Only', desc: 'Only female students' },
                    { value: 'mixed', label: 'Mixed', desc: 'Separate blocks by gender' },
                  ].map(option => (
                    <div key={option.value}>
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={option.value}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                          "hover:bg-muted/50",
                          formData.genderPolicy === option.value
                            ? "border-primary bg-primary/5"
                            : "border-muted"
                        )}
                      >
                        <span className="text-base font-bold">{option.label}</span>
                        <span className="text-sm text-muted-foreground">{option.desc}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.genderPolicy && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.genderPolicy}
                  </p>
                )}
              </div>

              {/* Tenant Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-bold">Who can rent your rooms? *</Label>
                <p className="text-sm text-muted-foreground">
                  Choose whether your hostel is exclusively for students or open to anyone
                </p>
                <RadioGroup
                  value={formData.tenantType}
                  onValueChange={(value) => updateField('tenantType', value as any)}
                  className="grid gap-4 md:grid-cols-2"
                >
                  {[
                    { 
                      value: 'students_only', 
                      label: 'Students Only', 
                      desc: 'Only university/college students can book' 
                    },
                    { 
                      value: 'anyone', 
                      label: 'Open to Anyone', 
                      desc: 'Students and non-students (working professionals, etc.)' 
                    },
                  ].map(option => (
                    <div key={option.value}>
                      <RadioGroupItem
                        value={option.value}
                        id={`tenant-${option.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`tenant-${option.value}`}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all text-center",
                          "hover:bg-muted/50",
                          formData.tenantType === option.value
                            ? "border-primary bg-primary/5"
                            : "border-muted"
                        )}
                      >
                        <span className="text-base font-bold">{option.label}</span>
                        <span className="text-sm text-muted-foreground">{option.desc}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.tenantType && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.tenantType}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Building Structure */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="totalFloors" className="text-base font-bold">
                    Total Floors/Blocks
                  </Label>
                  <Input
                    id="totalFloors"
                    type="number"
                    min="1"
                    value={formData.totalFloors || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                      updateField('totalFloors', isNaN(val) ? 0 : val);
                    }}
                    className="h-12 text-base"
                  />
                  <p className="text-sm text-muted-foreground">
                    How many floors or blocks does your hostel have?
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalRooms" className="text-base font-bold">
                    Total Rooms *
                  </Label>
                  <Input
                    id="totalRooms"
                    type="number"
                    min="1"
                    value={formData.totalRooms || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                      updateField('totalRooms', isNaN(val) ? 0 : val);
                    }}
                    className={cn("h-12 text-base", errors.totalRooms && "border-red-500")}
                  />
                  {errors.totalRooms && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.totalRooms}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Total number of rooms available for rent
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Caretaker Details</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="caretakerName" className="text-base font-bold">
                      Caretaker Name *
                    </Label>
                    <Input
                      id="caretakerName"
                      placeholder="Full name"
                      value={formData.caretakerName}
                      onChange={(e) => updateField('caretakerName', e.target.value)}
                      className={cn("h-12 text-base", errors.caretakerName && "border-red-500")}
                    />
                    {errors.caretakerName && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.caretakerName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caretakerPhone" className="text-base font-bold">
                      Caretaker Phone *
                    </Label>
                    <Input
                      id="caretakerPhone"
                      type="tel"
                      placeholder="e.g., 0712345678"
                      value={formData.caretakerPhone}
                      onChange={(e) => updateField('caretakerPhone', e.target.value)}
                      className={cn("h-12 text-base", errors.caretakerPhone && "border-red-500")}
                    />
                    {errors.caretakerPhone && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.caretakerPhone}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      An account will be created for your caretaker
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Safety Features</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select all safety features available at your hostel
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {safetyFeatureOptions.map((feature) => (
                    <div
                      key={feature.id}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all",
                        formData.safetyFeatures.includes(feature.id)
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:bg-muted/50"
                      )}
                      onClick={() => toggleSafetyFeature(feature.id)}
                    >
                      <Checkbox
                        id={feature.id}
                        checked={formData.safetyFeatures.includes(feature.id)}
                        onCheckedChange={() => toggleSafetyFeature(feature.id)}
                      />
                      <Label
                        htmlFor={feature.id}
                        className="text-base font-medium cursor-pointer flex-1"
                      >
                        {feature.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Room Types (Simplified) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 md:p-6">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Room Types Setup
                </h3>
                <p className="text-base text-muted-foreground mb-4">
                  You can add detailed room types after creating the hostel. For now, just tell us the basics:
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultRoomName" className="text-base font-bold">
                      Main Room Type Name
                    </Label>
                    <Input
                      id="defaultRoomName"
                      placeholder="e.g., Single Room, 2-Bed Shared, 4-Bed Dorm"
                      value={formData.roomTypes[0]?.name || ''}
                      onChange={(e) => updateField('roomTypes', [{ 
                        ...formData.roomTypes[0], 
                        name: e.target.value,
                        bedsPerRoom: formData.roomTypes[0]?.bedsPerRoom || 1,
                        genderRestriction: formData.roomTypes[0]?.genderRestriction || '',
                        amenities: formData.roomTypes[0]?.amenities || [],
                        monthlyRent: formData.roomTypes[0]?.monthlyRent || 0
                      }])}
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bedsPerRoom" className="text-base font-bold">
                        Beds Per Room *
                      </Label>
                      <Select
                        value={formData.roomTypes[0]?.bedsPerRoom?.toString() || '1'}
                        onValueChange={(value) => updateField('roomTypes', [{ 
                          ...formData.roomTypes[0],
                          name: formData.roomTypes[0]?.name || '',
                          bedsPerRoom: parseInt(value),
                          genderRestriction: formData.roomTypes[0]?.genderRestriction || '',
                          amenities: formData.roomTypes[0]?.amenities || [],
                          monthlyRent: formData.roomTypes[0]?.monthlyRent || 0
                        }])}
                      >
                        <SelectTrigger className={cn("h-12 text-base", errors.bedsPerRoom && "border-red-500")}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1" className="text-base">1 Bed (Single)</SelectItem>
                          <SelectItem value="2" className="text-base">2 Beds (Shared)</SelectItem>
                          <SelectItem value="3" className="text-base">3 Beds</SelectItem>
                          <SelectItem value="4" className="text-base">4 Beds (Dorm)</SelectItem>
                          <SelectItem value="6" className="text-base">6 Beds</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.bedsPerRoom && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.bedsPerRoom}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        This determines your hostel type (Single Rooms vs Shared Rooms)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlyRent" className="text-base font-bold">
                        Monthly Rent (KES) per bed *
                      </Label>
                      <Input
                        id="monthlyRent"
                        type="number"
                        min="0"
                        placeholder="e.g., 5000"
                        value={formData.roomTypes[0]?.monthlyRent || ''}
                        onChange={(e) => updateField('roomTypes', [{ 
                          ...formData.roomTypes[0],
                          name: formData.roomTypes[0]?.name || '',
                          bedsPerRoom: formData.roomTypes[0]?.bedsPerRoom || 1,
                          genderRestriction: formData.roomTypes[0]?.genderRestriction || '',
                          amenities: formData.roomTypes[0]?.amenities || [],
                          monthlyRent: parseInt(e.target.value) || 0
                        }])}
                        className={cn("h-12 text-base", errors.monthlyRent && "border-red-500")}
                      />
                      {errors.monthlyRent && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.monthlyRent}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> After creating your hostel, you can add more room types with different prices and amenities from the hostel management page.
              </p>
            </div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="depositAmount" className="text-base font-bold">
                    Deposit Amount (KES)
                  </Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    min="0"
                    placeholder="e.g., 5000"
                    value={formData.depositAmount || ''}
                    onChange={(e) => updateField('depositAmount', parseInt(e.target.value) || 0)}
                    className="h-12 text-base"
                  />
                  <p className="text-sm text-muted-foreground">
                    One-time deposit paid by student on move-in
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationFee" className="text-base font-bold">
                    Registration/Key Fee (KES)
                  </Label>
                  <Input
                    id="registrationFee"
                    type="number"
                    min="0"
                    placeholder="e.g., 500"
                    value={formData.registrationFee || ''}
                    onChange={(e) => updateField('registrationFee', parseInt(e.target.value) || 0)}
                    className="h-12 text-base"
                  />
                  <p className="text-sm text-muted-foreground">
                    One-time fee for registration or key deposit
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border">
                <Checkbox
                  id="depositRefundable"
                  checked={formData.depositRefundable}
                  onCheckedChange={(checked) => updateField('depositRefundable', checked as boolean)}
                />
                <Label htmlFor="depositRefundable" className="text-base font-medium cursor-pointer">
                  Deposit is refundable on checkout (when no damages)
                </Label>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Payment Terms</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-bold">Payment Cycle</Label>
                    <RadioGroup
                      value={formData.paymentCycle}
                      onValueChange={(value) => updateField('paymentCycle', value as any)}
                      className="grid gap-4 md:grid-cols-3"
                    >
                      {[
                        { value: 'monthly', label: 'Monthly', desc: 'Pay every month' },
                        { value: 'semester', label: 'Per Semester', desc: 'Pay once per semester' },
                        { value: 'annual', label: 'Annual', desc: 'Pay for full year' },
                      ].map(option => (
                        <div key={option.value}>
                          <RadioGroupItem
                            value={option.value}
                            id={`payment-${option.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`payment-${option.value}`}
                            className={cn(
                              "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                              "hover:bg-muted/50",
                              formData.paymentCycle === option.value
                                ? "border-primary bg-primary/5"
                                : "border-muted"
                            )}
                          >
                            <span className="text-base font-bold">{option.label}</span>
                            <span className="text-sm text-muted-foreground">{option.desc}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gracePeriod" className="text-base font-bold">
                        Grace Period (Days)
                      </Label>
                      <Input
                        id="gracePeriod"
                        type="number"
                        min="0"
                        max="30"
                        value={formData.gracePeriod}
                        onChange={(e) => updateField('gracePeriod', parseInt(e.target.value) || 0)}
                        className="h-12 text-base"
                      />
                      <p className="text-sm text-muted-foreground">
                        Days after due date before late fee applies
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lateFeePercent" className="text-base font-bold">
                        Late Fee (%)
                      </Label>
                      <Input
                        id="lateFeePercent"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.lateFeePercent}
                        onChange={(e) => updateField('lateFeePercent', parseInt(e.target.value) || 0)}
                        className="h-12 text-base"
                      />
                      <p className="text-sm text-muted-foreground">
                        Percentage of rent charged as late fee
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Rules & Compliance */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-bold">Minimum Stay</Label>
                  <RadioGroup
                    value={formData.minimumStay}
                    onValueChange={(value) => updateField('minimumStay', value as any)}
                    className="grid gap-4 md:grid-cols-3"
                  >
                    {[
                      { value: 'semester', label: 'One Semester', desc: 'Students stay for at least one semester' },
                      { value: 'year', label: 'Full Year', desc: 'Students commit for the full academic year' },
                      { value: 'flexible', label: 'Flexible', desc: 'No minimum stay requirement' },
                    ].map(option => (
                      <div key={option.value}>
                        <RadioGroupItem
                          value={option.value}
                          id={`stay-${option.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`stay-${option.value}`}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all text-center",
                            "hover:bg-muted/50",
                            formData.minimumStay === option.value
                              ? "border-primary bg-primary/5"
                              : "border-muted"
                          )}
                        >
                          <span className="text-base font-bold">{option.label}</span>
                          <span className="text-sm text-muted-foreground">{option.desc}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg border">
                  <Checkbox
                    id="midTermJoins"
                    checked={formData.midTermJoins}
                    onCheckedChange={(checked) => updateField('midTermJoins', checked as boolean)}
                  />
                  <Label htmlFor="midTermJoins" className="text-base font-medium cursor-pointer">
                    Allow mid-semester/term move-ins
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="houseRules" className="text-base font-bold">
                  House Rules
                </Label>
                <Textarea
                  id="houseRules"
                  placeholder="e.g., No loud music after 10pm. No overnight guests without permission. Keep common areas clean."
                  value={formData.houseRules}
                  onChange={(e) => updateField('houseRules', e.target.value)}
                  className="min-h-[150px] text-base"
                />
                <p className="text-sm text-muted-foreground">
                  Rules that all tenants must follow
                </p>
              </div>

              <div className="border-t pt-6">
                <div
                  className={cn(
                    "flex items-start space-x-3 p-4 rounded-lg border-2",
                    formData.termsAgreed ? "border-primary bg-primary/5" : "border-muted",
                    errors.termsAgreed && "border-red-500"
                  )}
                >
                  <Checkbox
                    id="termsAgreed"
                    checked={formData.termsAgreed}
                    onCheckedChange={(checked) => updateField('termsAgreed', checked as boolean)}
                  />
                  <Label htmlFor="termsAgreed" className="text-base font-medium cursor-pointer leading-relaxed">
                    I confirm that all information provided is accurate and I agree to RUMI's terms of service for property listing.
                  </Label>
                </div>
                {errors.termsAgreed && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.termsAgreed}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Upload Photos (Final Step) */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-base font-bold text-primary">
                  📸 5-8 photos make students book faster!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Current: {formData.images.length}/8 photos • {formatFileSize(formData.imageFiles.reduce((sum, f) => sum + f.size, 0))}
                </p>
              </div>

              <EnhancedHostelImageUpload
                onImagesChange={(images) => updateField('images', images)}
                onFilesChange={(files) => updateField('imageFiles', files)}
                onCategoriesChange={(categories) => updateField('photoCategories', categories)}
                initialImages={formData.images}
                initialCategories={formData.photoCategories}
                showValidation={true}
              />

              {errors.images && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-base font-bold text-red-900 dark:text-red-100 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {errors.images}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground text-center">
                  <strong>Note:</strong> After publishing, you can edit photos anytime from your dashboard
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleSaveDraft}
            className="gap-2"
          >
            <Save className="h-5 w-5" />
            <span className="hidden md:inline">Save Draft</span>
          </Button>
        </div>

        {currentStep < steps.length ? (
          <Button
            size="lg"
            onClick={handleNext}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </Button>
        ) : (
          <div className="flex gap-2">
            {/* Skip Photos Button (only on Step 6) */}
            {currentStep === 6 && formData.images.length < 5 && (
              <Button
                variant="outline"
                size="lg"
                onClick={async () => {
                  if (window.confirm('⚠️ Students book 3x faster with photos. Are you sure you want to skip?')) {
                    await handleSubmit();
                  }
                }}
                disabled={createHostel.isPending}
                className="gap-2"
              >
                ⏭️ Skip Photos
              </Button>
            )}
            
            {/* Publish Button */}
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={createHostel.isPending || (currentStep === 6 && formData.images.length < 5)}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {createHostel.isPending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  {currentStep === 6 && formData.images.length >= 5 ? 'Publish Hostel' : 'Create Hostel'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
