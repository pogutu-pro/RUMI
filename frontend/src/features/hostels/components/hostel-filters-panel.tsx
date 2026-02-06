'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  SlidersHorizontal, 
  MapPin, 
  Building2, 
  Wallet, 
  Users, 
  Sparkles,
  Wifi,
  ShieldCheck,
  ParkingCircle,
  Shirt,
  Droplets,
  Dumbbell,
  BookOpen,
  Utensils,
  GraduationCap,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FiltersState {
  university?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  hostel_type?: string;
  gender_policy?: string;
  amenities?: string[];
}

interface HostelFiltersPanelProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  onClearFilters: () => void;
  onClose?: () => void;
  className?: string;
}

const UNIVERSITIES = [
  { value: 'University of Nairobi', label: 'University of Nairobi', short: 'UoN' },
  { value: 'Kenyatta University', label: 'Kenyatta University', short: 'KU' },
  { value: 'Moi University', label: 'Moi University', short: 'Moi' },
  { value: 'JKUAT', label: 'JKUAT', short: 'JKUAT' },
  { value: 'Strathmore University', label: 'Strathmore University', short: 'Strathmore' },
];

const CITIES = [
  { value: 'Nairobi', label: 'Nairobi' },
  { value: 'Eldoret', label: 'Eldoret' },
  { value: 'Mombasa', label: 'Mombasa' },
  { value: 'Kisumu', label: 'Kisumu' },
  { value: 'Nakuru', label: 'Nakuru' },
];

const AMENITIES = [
  { id: 'WiFi', label: 'WiFi', icon: '📶', popular: true },
  { id: 'Security', label: '24/7 Security', icon: '🔒', popular: true },
  { id: 'Parking', label: 'Parking', icon: '🚗', popular: false },
  { id: 'Laundry', label: 'Laundry', icon: '👕', popular: true },
  { id: 'Water 24/7', label: 'Water 24/7', icon: '💧', popular: true },
  { id: 'Gym', label: 'Gym', icon: '💪', popular: false },
  { id: 'Study Room', label: 'Study Room', icon: '📚', popular: true },
  { id: 'Kitchen', label: 'Kitchen', icon: '🍳', popular: false },
];

export function HostelFiltersPanel({
  filters,
  onFiltersChange,
  onClearFilters,
  onClose,
  className,
}: HostelFiltersPanelProps) {
  const [priceRange, setPriceRange] = React.useState<[number, number]>([
    filters.min_price || 5000,
    filters.max_price || 50000,
  ]);

  const handlePriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
  };

  const handlePriceCommit = (values: number[]) => {
    onFiltersChange({
      ...filters,
      min_price: values[0],
      max_price: values[1],
    });
  };

  const handleAmenityToggle = (amenity: string, checked: boolean) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = checked
      ? [...currentAmenities, amenity]
      : currentAmenities.filter((a) => a !== amenity);
    
    onFiltersChange({
      ...filters,
      amenities: newAmenities.length > 0 ? newAmenities : undefined,
    });
  };

  const activeFiltersCount = 
    (filters.university ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.hostel_type ? 1 : 0) +
    (filters.gender_policy ? 1 : 0) +
    ((filters.min_price !== 5000 || filters.max_price !== 50000) ? 1 : 0) +
    (filters.amenities?.length || 0);

  const hasActiveFilters = activeFiltersCount > 0;
  const popularAmenities = AMENITIES.filter(a => a.popular);
  const otherAmenities = AMENITIES.filter(a => !a.popular);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Filters</h2>
              {hasActiveFilters && (
                <p className="text-xs text-muted-foreground">
                  {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Filters Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10">
        
        {/* Section: Location */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <MapPin className="h-3.5 w-3.5" />
            <span>Location</span>
          </div>
          
          <div className="space-y-5 pl-1">
            {/* University */}
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold text-gray-900">University</Label>
              <Select
                value={filters.university}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, university: value })
                }
              >
                <SelectTrigger className="h-12 bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200 focus:ring-2 focus:ring-gray-900 focus:bg-white rounded-lg transition-all font-medium">
                  <SelectValue placeholder="Select university" />
                </SelectTrigger>
                <SelectContent>
                  {UNIVERSITIES.map((uni) => (
                    <SelectItem key={uni.value} value={uni.value} className="py-3 font-medium cursor-pointer">
                      {uni.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold text-gray-900">City</Label>
              <Select
                value={filters.city}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, city: value })
                }
              >
                <SelectTrigger className="h-12 bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200 focus:ring-2 focus:ring-gray-900 focus:bg-white rounded-lg transition-all font-medium">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city.value} value={city.value} className="py-3 font-medium cursor-pointer">
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section: Price Range */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Wallet className="h-3.5 w-3.5" />
            <span>Budget</span>
          </div>
          
          <div className="space-y-6 px-1">
            {/* Range Display */}
            <div className="flex items-center justify-between text-sm font-bold text-gray-900">
              <span>KES {priceRange[0].toLocaleString()}</span>
              <span>KES {priceRange[1].toLocaleString()}</span>
            </div>

            {/* Slider */}
            <div className="pt-2">
              <Slider
                value={priceRange}
                min={5000}
                max={50000}
                step={1000}
                onValueChange={handlePriceChange}
                onValueCommit={handlePriceCommit}
                className="w-full cursor-pointer py-4"
                aria-label="Price range slider"
              />
            </div>
          </div>
        </div>

        {/* Section: Preferences */}
        <div className="space-y-5">
           <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Building2 className="h-3.5 w-3.5" />
            <span>Preferences</span>
          </div>

          {/* Hostel Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900 block">Room Type</Label>
            <div className="grid grid-cols-3 gap-3">
              {['single_rooms', 'shared_rooms', 'mixed'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => 
                    onFiltersChange({ 
                      ...filters, 
                      hostel_type: filters.hostel_type === type ? undefined : type 
                    })
                  }
                  className={cn(
                    'px-2 py-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 shadow-sm transform-gpu',
                    filters.hostel_type === type
                      ? 'border-gray-900 bg-gray-900 text-white ring-1 ring-gray-900'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {type === 'single_rooms' && (
                    <>
                      <span className="text-xl">🏠</span>
                      <span className="tracking-tight">Single</span>
                    </>
                  )}
                  {type === 'shared_rooms' && (
                    <>
                      <span className="text-xl">👥</span>
                      <span className="tracking-tight">Shared</span>
                    </>
                  )}
                  {type === 'mixed' && (
                    <>
                      <span className="text-xl text-gray-400">❖</span>
                      <span className="tracking-tight">Any</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Policy */}
          <div className="space-y-3 pt-2">
            <Label className="text-sm font-semibold text-gray-900 block">Gender Policy</Label>
            <div className="grid grid-cols-3 gap-3">
              {['male_only', 'female_only', 'mixed'].map((policy) => (
                <button
                  key={policy}
                  type="button"
                  onClick={() => 
                    onFiltersChange({ 
                      ...filters, 
                      gender_policy: filters.gender_policy === policy ? undefined : policy 
                    })
                  }
                  className={cn(
                    'px-2 py-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 shadow-sm transform-gpu',
                    filters.gender_policy === policy
                      ? 'border-gray-900 bg-gray-900 text-white ring-1 ring-gray-900'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {policy === 'male_only' && (
                     <>
                      <span className="text-xl">♂</span>
                      <span className="tracking-tight">Male</span>
                    </>
                  )}
                  {policy === 'female_only' && (
                     <>
                      <span className="text-xl">♀</span>
                      <span className="tracking-tight">Female</span>
                    </>
                  )}
                  {policy === 'mixed' && (
                     <>
                      <span className="text-xl text-gray-400">⚤</span>
                      <span className="tracking-tight">Any</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Amenities */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Amenities</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {AMENITIES.map((amenity) => (
              <label
                key={amenity.id}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all hover:bg-gray-50',
                  filters.amenities?.includes(amenity.id)
                    ? 'border-gray-900 ring-1 ring-gray-900 bg-gray-50/50'
                    : 'border-gray-200'
                )}
              >
                <Checkbox
                  id={`amenity-${amenity.id}`}
                  checked={filters.amenities?.includes(amenity.id)}
                  onCheckedChange={(checked) =>
                    handleAmenityToggle(amenity.id, checked as boolean)
                  }
                  className="data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900 rounded-[4px] h-5 w-5"
                />
                <span className="text-sm font-medium text-gray-700 select-none">{amenity.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - Sticky */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="flex-1 h-11 font-semibold border-gray-200 text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Clear all
            </Button>
          )}
          <Button
            onClick={onClose}
            className={cn(
              "h-11 font-semibold bg-gray-900 hover:bg-black text-white shadow-none rounded-md",
              hasActiveFilters ? "flex-1" : "w-full"
            )}
          >
            Show results
          </Button>
        </div>
      </div>
    </div>
  );
}
