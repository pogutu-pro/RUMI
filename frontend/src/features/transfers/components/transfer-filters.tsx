import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { SlidersHorizontal, X } from 'lucide-react';
import { useTransferStore } from '@/features/transfers';
import { ROOM_TYPE_LABELS, ROOMMATE_PREFERENCE_LABELS } from '@/lib/constants/transfer-rules';

interface TransferFiltersProps {
  onClose?: () => void;
}

export function TransferFilters({ onClose }: TransferFiltersProps) {
  const { filters, setFilters, resetFilters } = useTransferStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const [localFilters, setLocalFilters] = React.useState(filters);

  const handleApply = () => {
    setFilters(localFilters);
    setIsOpen(false);
    onClose?.();
  };

  const handleReset = () => {
    resetFilters();
    setLocalFilters({
      priceRange: undefined,
      roomTypes: undefined,
      floors: undefined,
      quietFloorOnly: false,
      roommatePreference: 'any',
      searchQuery: '',
    });
  };

  const updateLocalFilter = (key: string, value: any) => {
    setLocalFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {Object.values(filters).filter((v) => v && (typeof v !== 'boolean' || v === true)).length > 0 && (
            <span className="ml-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
              {Object.values(filters).filter((v) => v && (typeof v !== 'boolean' || v === true)).length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Rooms</SheetTitle>
          <SheetDescription>
            Narrow down your search to find the perfect room
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Price Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Price Range (KES)</Label>
              <span className="text-sm text-muted-foreground">
                {localFilters.priceRange?.min || 0} - {localFilters.priceRange?.max || 30000}
              </span>
            </div>
            <Slider
              min={0}
              max={30000}
              step={500}
              value={[
                localFilters.priceRange?.min || 0,
                localFilters.priceRange?.max || 30000,
              ]}
              onValueChange={([min, max]) =>
                updateLocalFilter('priceRange', { min, max })
              }
              className="mt-2"
            />
          </div>

          {/* Room Type */}
          <div className="space-y-3">
            <Label>Room Type</Label>
            <div className="space-y-2">
              {Object.entries(ROOM_TYPE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`room-type-${key}`}
                    checked={localFilters.roomTypes?.includes(key as any) || false}
                    onCheckedChange={(checked) => {
                      const current = localFilters.roomTypes || [];
                      if (checked) {
                        updateLocalFilter('roomTypes', [...current, key]);
                      } else {
                        updateLocalFilter(
                          'roomTypes',
                          current.filter((t: string) => t !== key)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`room-type-${key}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Floor Selection */}
          <div className="space-y-3">
            <Label>Floor Preference</Label>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((floor) => (
                <div key={floor} className="flex items-center space-x-2">
                  <Checkbox
                    id={`floor-${floor}`}
                    checked={localFilters.floors?.includes(floor) || false}
                    onCheckedChange={(checked) => {
                      const current = localFilters.floors || [];
                      if (checked) {
                        updateLocalFilter('floors', [...current, floor]);
                      } else {
                        updateLocalFilter(
                          'floors',
                          current.filter((f: number) => f !== floor)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`floor-${floor}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Floor {floor}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Floor Only */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="quietFloor"
              checked={localFilters.quietFloorOnly || false}
              onCheckedChange={(checked) =>
                updateLocalFilter('quietFloorOnly', checked)
              }
            />
            <label
              htmlFor="quietFloor"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Quiet Floor Only
            </label>
          </div>

          {/* Roommate Preference */}
          <div className="space-y-3">
            <Label>Roommate Preference</Label>
            <RadioGroup
              value={localFilters.roommatePreference || 'any'}
              onValueChange={(value) =>
                updateLocalFilter('roommatePreference', value)
              }
            >
              {Object.entries(ROOMMATE_PREFERENCE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={`roommate-${key}`} />
                  <label
                    htmlFor={`roommate-${key}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
