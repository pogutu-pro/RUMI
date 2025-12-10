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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  SlidersHorizontal, 
  MapPin, 
  Building2, 
  Wallet, 
  Users, 
  Sparkles,
  Check
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
  { value: 'Nairobi', label: 'Nairobi', icon: '🏙️' },
  { value: 'Eldoret', label: 'Eldoret', icon: '🌾' },
  { value: 'Mombasa', label: 'Mombasa', icon: '🏖️' },
  { value: 'Kisumu', label: 'Kisumu', icon: '⛵' },
  { value: 'Nakuru', label: 'Nakuru', icon: '🦩' },
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

export default function HostelFiltersPanel({
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
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <SlidersHorizontal className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Filters</h2>
              {hasActiveFilters && (
                <p className="text-xs text-gray-500">
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
              className="rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Filters Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Location Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <span>Location</span>
          </div>
          
          {/* University */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">University</Label>
            <Select
              value={filters.university}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, university: value })
              }
            >
              <SelectTrigger className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500">
                <SelectValue placeholder="Select your university" />
              </SelectTrigger>
              <SelectContent>
                {UNIVERSITIES.map((uni) => (
                  <SelectItem key={uni.value} value={uni.value} className="py-3">
                    <div className="flex items-center justify-between w-full">
                      <span>{uni.label}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {uni.short}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">City</Label>
            <Select
              value={filters.city}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, city: value })
              }
            >
              <SelectTrigger className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((city) => (
                  <SelectItem key={city.value} value={city.value} className="py-3">
                    <span className="flex items-center gap-2">
                      <span>{city.icon}</span>
                      <span>{city.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Price Range Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Wallet className="h-4 w-4 text-emerald-600" />
            <span>Price Range</span>
          </div>
          
          <div className="space-y-4">
            {/* Range Display */}
            <div className="flex items-center justify-between">
              <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-xs text-emerald-700 font-medium">Min</div>
                <div className="font-bold text-emerald-900">
                  KES {priceRange[0].toLocaleString()}
                </div>
              </div>
              <div className="h-px w-8 bg-gray-300" />
              <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-xs text-emerald-700 font-medium">Max</div>
                <div className="font-bold text-emerald-900">
                  KES {priceRange[1].toLocaleString()}
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="pt-2 pb-1">
              <Slider
                value={priceRange}
                min={5000}
                max={50000}
                step={1000}
                onValueChange={handlePriceChange}
                onValueCommit={handlePriceCommit}
                className="w-full"
                aria-label="Price range slider"
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Average: KES {Math.round((priceRange[0] + priceRange[1]) / 2).toLocaleString()} / month
            </p>
          </div>
        </div>

        <Separator />

        {/* Hostel Type & Gender Policy */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <span>Hostel Preferences</span>
          </div>

          {/* Hostel Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Room Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {['single_rooms', 'shared_rooms', 'mixed'].map((type) => (
                <button
                  key={type}
                  onClick={() => 
                    onFiltersChange({ 
                      ...filters, 
                      hostel_type: filters.hostel_type === type ? undefined : type 
                    })
                  }
                  className={cn(
                    'px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all',
                    filters.hostel_type === type
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  {type === 'single_rooms' && '🏠 Single'}
                  {type === 'shared_rooms' && '👥 Shared'}
                  {type === 'mixed' && '🔀 Mixed'}
                  {filters.hostel_type === type && (
                    <Check className="h-3 w-3 inline ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Policy */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Gender Policy</Label>
            <div className="grid grid-cols-3 gap-2">
              {['male_only', 'female_only', 'mixed'].map((policy) => (
                <button
                  key={policy}
                  onClick={() => 
                    onFiltersChange({ 
                      ...filters, 
                      gender_policy: filters.gender_policy === policy ? undefined : policy 
                    })
                  }
                  className={cn(
                    'px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all',
                    filters.gender_policy === policy
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  {policy === 'male_only' && '♂️ Male'}
                  {policy === 'female_only' && '♀️ Female'}
                  {policy === 'mixed' && '⚥ Mixed'}
                  {filters.gender_policy === policy && (
                    <Check className="h-3 w-3 inline ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Amenities Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>Amenities</span>
          </div>

          {/* Popular Amenities */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Most Popular
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {popularAmenities.map((amenity) => (
                <label
                  key={amenity.id}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all',
                    filters.amenities?.includes(amenity.id)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-200 bg-white'
                  )}
                >
                  <Checkbox
                    id={`amenity-${amenity.id}`}
                    checked={filters.amenities?.includes(amenity.id)}
                    onCheckedChange={(checked) =>
                      handleAmenityToggle(amenity.id, checked as boolean)
                    }
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <span className="text-lg">{amenity.icon}</span>
                  <span className="text-sm font-medium flex-1">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Other Amenities */}
          {otherAmenities.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                More Options
              </Label>
              <div className="space-y-2">
                {otherAmenities.map((amenity) => (
                  <label
                    key={amenity.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
                  >
                    <Checkbox
                      id={`amenity-${amenity.id}`}
                      checked={filters.amenities?.includes(amenity.id)}
                      onCheckedChange={(checked) =>
                        handleAmenityToggle(amenity.id, checked as boolean)
                      }
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <span className="text-base">{amenity.icon}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {amenity.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Sticky */}
      <div className="sticky bottom-0 bg-white border-t px-6 py-4">
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="flex-1 h-11 font-semibold border-gray-300 hover:bg-gray-50"
            >
              Clear all
            </Button>
          )}
          <Button
            onClick={onClose}
            className={cn(
              "h-11 font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md",
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
