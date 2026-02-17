'use client';

import { motion } from 'framer-motion';
import { Users, Bed, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Room } from '@/types/entities.types';

interface RoomSelectionCardProps {
  room: Room;
  isSelected: boolean;
  selectedBedId?: string | null;
  onSelect: (roomId: string) => void;
  onSelectBed?: (bedId: string) => void;
  pricePerMonth?: number;
}

export default function RoomSelectionCard({
  room,
  isSelected,
  selectedBedId,
  onSelect,
  onSelectBed,
  pricePerMonth
}: RoomSelectionCardProps) {
  const isFull = !room.is_available;
  const isFewLeft = room.is_available && room.capacity <= 2; // Simplified logic as 'occupied' count is not in unified type yet
  // Let's assume 'beds' in Room type is total capacity, and we need a way to know occupied.
  // Actually, looking at the type: beds: number, capacity: number. 
  // Let's assume 'available' boolean is the source of truth for now, and we simulate 'few left' randomly or if we had real data.
  
  // For now, let's use the 'available' flag.
  
  return (
    <div
      onClick={() => !isFull && onSelect(String(room.id))}
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all cursor-pointer group",
        isSelected
          ? "border-emerald-500 bg-emerald-50/50"
          : "border-slate-100 hover:border-slate-200 bg-white",
        isFull && "opacity-75 cursor-not-allowed bg-slate-50 border-slate-100"
      )}
    >
      {/* Selection Checkmark */}
      {isSelected && (
        <div className="absolute -top-3 -right-3 bg-emerald-500 text-white p-1 rounded-full shadow-md">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-slate-900">Room {room.room_number}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 font-normal">
              <Users className="w-3 h-3 mr-1" />
              {room.capacity > 1 ? 'Shared Room' : 'Private Room'}
            </Badge>
        </div>
      </div>
        <div className="text-right">
          <div className="font-bold text-slate-900">
            KSh {Number(room.base_price || pricePerMonth || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 uppercase font-medium">
            {room.capacity > 1 ? 'per person/mo' : '/ month'}
          </div>
        </div>
      </div>

      {/* Room Features / Bed Count */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex -space-x-2">
           {/* Generate bed icons or interactive buttons based on capacity */}
           {room.beds && room.beds.length > 0 ? (
             room.beds.map((bed, i) => {
               const isBedSelected = String(bed.id) === selectedBedId;
               return (
                 <div 
                   key={bed.id} 
                   onClick={(e) => {
                     if (isSelected && onSelectBed) {
                       e.stopPropagation();
                       onSelectBed(String(bed.id));
                     }
                   }}
                   className={cn(
                     "w-9 h-9 rounded-full flex flex-col items-center justify-center border-2 transition-all",
                     isBedSelected 
                        ? "bg-emerald-600 border-emerald-600 text-white z-10 scale-110 shadow-sm" 
                        : "bg-emerald-100 border-white text-emerald-600 hover:bg-emerald-200",
                     !isSelected && "bg-slate-100 text-slate-400 border-white"
                   )}
                   title={bed.custom_account_number || `Bed ${bed.code}`}
                 >
                   <Bed className="w-3.5 h-3.5" />
                   {isSelected && <span className="text-[8px] font-bold leading-none mt-0.5">{bed.code}</span>}
                 </div>
               );
             })
           ) : (
             Array.from({ length: room.capacity }).map((_, i) => (
               <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white bg-slate-100 text-slate-400">
                 <Bed className="w-4 h-4" />
               </div>
             ))
           )}
        </div>
        <div className="text-xs text-slate-600">
          {isFull ? (
            <span className="text-red-500 font-medium flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Fully Booked
            </span>
          ) : (
            <div className="flex flex-col">
              <span>
                <span className="font-bold text-emerald-600">{room.beds?.length || room.capacity} capacity</span> • Instant Booking
              </span>
              {isSelected && selectedBedId && (
                <span className="text-[10px] text-slate-500 mt-0.5 italic">
                  Selected Bed: {room.beds?.find(b => String(b.id) === selectedBedId)?.code}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Button (Visual only, selection happens on card click) */}
      <div className="w-full">
        {isFull ? (
          <Button 
            variant="outline" 
            className="w-full h-9 text-xs font-bold border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-600"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement waiting list logic
            }}
          >
            Join Waiting List
          </Button>
        ) : (
          <div className={cn(
            "w-full h-9 rounded-md flex items-center justify-center text-xs font-bold transition-colors",
            isSelected 
              ? "bg-emerald-500 text-white shadow-sm" 
              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
          )}>
            {isSelected ? 'Selected' : 'Select Room'}
          </div>
        )}
      </div>
    </div>
  );
}
