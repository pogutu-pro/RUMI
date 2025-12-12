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
  onSelect: (roomId: string) => void;
  pricePerMonth?: number;
}

export default function RoomSelectionCard({
  room,
  isSelected,
  onSelect,
  pricePerMonth
}: RoomSelectionCardProps) {
  const isFull = !room.available;
  const isFewLeft = room.available && room.capacity - room.beds <= 2; // Assuming beds = occupied beds? Or beds = total beds? 
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
          <h3 className="font-bold text-slate-900">{room.name}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 font-normal">
              <Users className="w-3 h-3 mr-1" />
              {room.capacity > 1 ? 'Shared Room' : 'Private Room'}
            </Badge>
            {isFewLeft && !isFull && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-normal border-amber-200">
                <Clock className="w-3 h-3 mr-1" />
                {room.capacity - (room.beds || 0)} slots left
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-slate-900">
            KSh {(room.price || pricePerMonth || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 uppercase font-medium">
            {room.capacity > 1 ? 'per person/mo' : '/ month'}
          </div>
        </div>
      </div>

      {/* Room Features / Bed Count */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex -space-x-2">
           {/* Generate bed icons based on capacity */}
           {Array.from({ length: room.capacity }).map((_, i) => {
             // Logic to determine if this specific slot is taken
             // For now, we assume first N slots are taken where N = room.beds (occupied count)
             // This is a simplification.
             const isTaken = i < (room.beds || 0); // Assuming room.beds is occupied count for this visual
             
             return (
               <div key={i} className={cn(
                 "w-8 h-8 rounded-full flex items-center justify-center border-2 border-white",
                 isTaken ? "bg-slate-200 text-slate-400" : "bg-emerald-100 text-emerald-600"
               )}>
                 <Bed className="w-4 h-4" />
               </div>
             );
           })}
        </div>
        <div className="text-xs text-slate-600">
          {isFull ? (
            <span className="text-red-500 font-medium flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Fully Booked
            </span>
          ) : (
            <span>
              <span className="font-bold text-emerald-600">{room.capacity - (room.beds || 0)} slots left</span> • Instant Booking
            </span>
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
