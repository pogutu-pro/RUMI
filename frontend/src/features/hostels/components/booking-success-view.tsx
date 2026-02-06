'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Home, ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface BookingSuccessViewProps {
  bookingId: string | number;
  hostelName: string;
  roomName: string;
  moveInDate: Date;
  amountPaid: number;
  isPending?: boolean;
}

export default function BookingSuccessView({
  bookingId,
  hostelName,
  roomName,
  moveInDate,
  amountPaid,
  isPending = false
}: BookingSuccessViewProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </motion.div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {isPending ? 'Verification Pending' : 'Booking Confirmed!'}
      </h2>
      <p className="text-slate-600 mb-8 max-w-xs">
        {isPending 
          ? `Your claim for a room at ${hostelName} has been sent for verification.`
          : `You are now a resident at ${hostelName}.`}
      </p>

      {/* Receipt Card */}
      <div className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 text-left relative overflow-hidden">
        {/* Decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-600" />
        
        <div className="space-y-4">
          <div className="flex justify-between items-start pb-4 border-b border-slate-200">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Receipt No.</p>
              <p className="font-mono text-slate-900">#{bookingId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase font-bold">
                {isPending ? 'Monthly Rent' : 'Amount Paid'}
              </p>
              <p className="font-bold text-emerald-600">KSh {amountPaid.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Room</p>
              <p className="text-sm font-medium text-slate-900">{roomName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Move-in Date</p>
              <p className="text-sm font-medium text-slate-900">{format(moveInDate, 'dd MMM yyyy')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 w-full max-w-sm">
        <Button 
          className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
          onClick={() => router.push('/student/dashboard')}
        >
          <Home className="w-4 h-4 mr-2" />
          Go to My Dashboard
        </Button>
        
        <Button 
          variant="outline"
          className="w-full h-12 font-medium border-slate-200 text-slate-600 hover:bg-slate-50"
          onClick={() => {
            // TODO: Implement receipt download
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          Download Receipt
        </Button>
      </div>
    </div>
  );
}
