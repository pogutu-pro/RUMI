'use client';

import { User, UserPlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BookingModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'solo' | 'invite') => void;
  price: number;
}

export default function BookingModeSelector({
  isOpen,
  onClose,
  onSelectMode,
  price
}: BookingModeSelectorProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">How would you like to book?</DialogTitle>
          <DialogDescription className="text-center">
            This is a shared room. You can book just for yourself or invite a friend.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Solo Option */}
          <button
            onClick={() => onSelectMode('solo')}
            className="flex items-center p-4 border-2 border-slate-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors mr-4">
              <User className="w-6 h-6 text-slate-600 group-hover:text-emerald-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900">Book for myself</h4>
              <p className="text-xs text-slate-500 mt-1">Pay for 1 slot. We'll match you with a roommate later.</p>
            </div>
            <div className="text-right">
              <span className="block font-bold text-slate-900">KSh {price.toLocaleString()}</span>
            </div>
          </button>

          {/* Invite Option */}
          <button
            onClick={() => onSelectMode('invite')}
            className="flex items-center p-4 border-2 border-slate-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors mr-4">
              <UserPlus className="w-6 h-6 text-slate-600 group-hover:text-emerald-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900">Book & Invite a friend</h4>
              <p className="text-xs text-slate-500 mt-1">Secure your slot and send an invite link to your friend.</p>
            </div>
            <div className="text-right">
              <span className="block font-bold text-slate-900">KSh {price.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold">+ Friend pays same</span>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
