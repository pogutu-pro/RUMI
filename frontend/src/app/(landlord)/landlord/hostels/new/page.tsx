"use client";

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Home, 
  Wifi, 
  Shield, 
  Car, 
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Save,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { HostelImageUpload } from '@/features/hostels';
import { toast } from 'sonner';

// Amenities list for selection
const AMENITIES = [
  { id: 'wifi', label: 'High-Speed WiFi', icon: Wifi },
  { id: 'security', label: '24/7 Security', icon: Shield },
  { id: 'parking', label: 'Secure Parking', icon: Car },
  { id: 'backup', label: 'Backup Generator', icon: Zap },
  { id: 'water', label: 'Borehole Water', icon: CheckCircle2 },
];

export default function AddHostelPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
      name: '',
      type: 'mixed',
      address: '',
      description: '',
      totalRooms: 20,
      basePrice: '',
      amenities: [] as string[],
      images: [] as File[],
  });

  const updateField = (field: string, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAmenityToggle = (id: string) => {
      setFormData(prev => ({
          ...prev,
          amenities: prev.amenities.includes(id) 
             ? prev.amenities.filter(a => a !== id)
             : [...prev.amenities, id]
      }));
  };

  const handleSubmit = async () => {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
          setLoading(false);
          toast.success("Hostel added successfully!");
          router.push('/landlord/hostels');
      }, 2000);
      
      // Real implementation would append formData.images to FormData object
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col items-center text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">List Your Property</h1>
            <p className="text-slate-500 max-w-lg">Add a new hostel to your portfolio. Follow the steps to provide all necessary details.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center">
             {[1, 2, 3].map((s) => (
                 <div key={s} className="flex items-center">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold ${step >= s ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'border-slate-200 text-slate-400'}`}>
                         {s}
                     </div>
                     {s < 3 && (
                         <div className={`w-20 md:w-32 h-1 mx-2 rounded-full transition-all duration-300 ${step > s ? 'bg-emerald-600' : 'bg-slate-100'}`} />
                     )}
                 </div>
             ))}
        </div>

        <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden min-h-[500px] flex flex-col">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
                <CardTitle>{step === 1 ? 'Basic Details' : step === 2 ? 'Features & Amenities' : 'Media Gallery'}</CardTitle>
                <CardDescription>
                    {step === 1 ? 'Tell us about your property location and capacity.' : step === 2 ? 'What makes your hostel stand out?' : 'Upload high-quality photos (Max 8).'}
                </CardDescription>
            </CardHeader>
            
            <div className="flex-1 p-6 relative">
                 <AnimatePresence mode="wait">
                     {step === 1 && (
                         <motion.div
                           key="step1"
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           className="space-y-6"
                         >
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-2">
                                     <Label>Hostel Name</Label>
                                     <Input placeholder="e.g. Sunny Makers Hostel" value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
                                 </div>
                                 <div className="space-y-2">
                                     <Label>Type</Label>
                                     <Select value={formData.type} onValueChange={(v) => updateField('type', v)}>
                                         <SelectTrigger>
                                             <SelectValue placeholder="Select type" />
                                         </SelectTrigger>
                                         <SelectContent>
                                             <SelectItem value="mixed">Mixed</SelectItem>
                                             <SelectItem value="mens">Men's Only</SelectItem>
                                             <SelectItem value="ladies">Ladies' Only</SelectItem>
                                         </SelectContent>
                                     </Select>
                                 </div>
                                 <div className="space-y-2 md:col-span-2">
                                     <Label>Address / Location</Label>
                                     <div className="relative">
                                         <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                         <Input className="pl-9" placeholder="e.g. 123 University Way, Nairobi" value={formData.address} onChange={(e) => updateField('address', e.target.value)} />
                                     </div>
                                 </div>
                                 <div className="space-y-2 md:col-span-2">
                                     <Label>Description</Label>
                                     <Textarea placeholder="Describe your hostel..." className="min-h-[100px]" value={formData.description} onChange={(e) => updateField('description', e.target.value)} />
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
                           className="space-y-8"
                         >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                   <div className="space-y-4">
                                       <Label className="text-lg font-semibold">Capacity & Pricing</Label>
                                       <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <Label>Total Rooms</Label>
                                                    <span className="font-bold text-emerald-600">{formData.totalRooms}</span>
                                                </div>
                                                <Slider min={5} max={100} step={1} value={[formData.totalRooms]} onValueChange={(v) => updateField('totalRooms', v[0])} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Base Rent (KES / Month)</Label>
                                                <Input type="number" placeholder="e.g. 15000" value={formData.basePrice} onChange={(e) => updateField('basePrice', e.target.value)} />
                                            </div>
                                       </div>
                                   </div>

                                   <div className="space-y-4">
                                        <Label className="text-lg font-semibold">Amenities</Label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {AMENITIES.map((amenity) => {
                                                const Icon = amenity.icon;
                                                const isSelected = formData.amenities.includes(amenity.id);
                                                return (
                                                    <div 
                                                        key={amenity.id}
                                                        onClick={() => handleAmenityToggle(amenity.id)}
                                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                    >
                                                        <div className={`p-2 rounded-full mr-3 ${isSelected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <span className={`font-medium ${isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-600 dark:text-slate-300'}`}>{amenity.label}</span>
                                                        {isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-600 ml-auto" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
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
                           className="space-y-6"
                         >
                             <HostelImageUpload 
                                 onImagesChange={() => {}} // We use onFilesChange
                                 onFilesChange={(files) => updateField('images', files)}
                                 initialImages={[]}
                             />
                             
                             <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-lg flex gap-3 items-start border border-blue-100">
                                 <Shield className="h-5 w-5 shrink-0 mt-0.5" />
                                 <p>By uploading these images, you certify that you own the rights to them and they accurately represent the property. False representation may lead to account suspension.</p>
                             </div>
                         </motion.div>
                     )}
                 </AnimatePresence>
            </div>

            <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50">
                 <Button variant="ghost" onClick={prevStep} disabled={step === 1 || loading}>
                     <ArrowLeft className="h-4 w-4 mr-2" /> Back
                 </Button>
                 
                 {step < 3 ? (
                     <Button onClick={nextStep} className="bg-slate-900 text-white hover:bg-slate-800">
                         Continue <ArrowRight className="h-4 w-4 ml-2" />
                     </Button>
                 ) : (
                     <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 w-32">
                         {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Publish</>}
                     </Button>
                 )}
            </CardFooter>
        </Card>
    </div>
  );
}
