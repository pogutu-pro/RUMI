'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudentStore } from '@/features/student';

interface CompareTrayProps {
  comparePath?: string;
}

export function CompareTray({ comparePath = '/student/compare' }: CompareTrayProps) {
  const router = useRouter();
  const { compareList, removeFromCompare } = useStudentStore();

  if (compareList.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none flex justify-center"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 flex items-center gap-4 pointer-events-auto max-w-lg w-full mx-4">
          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
            {compareList.map((hostel) => (
              <div
                key={hostel.id}
                className="relative bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2 min-w-[100px] max-w-[140px]"
              >
                <div className="truncate text-xs font-medium text-gray-900">
                  {hostel.name}
                </div>
                <button
                  onClick={() => removeFromCompare(hostel.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-l pl-4 border-gray-100">
            <Button
              size="sm"
              variant="default"
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-4 h-9 shadow-lg shadow-indigo-500/20"
              onClick={() => router.push(comparePath)}
            >
              Compare
              <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                {compareList.length}
              </span>
            </Button>
            {/* 
            // Optional clear button if UI gets cluttered, but X per item is fine
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearCompare}>
               <X className="h-4 w-4"/> 
            </Button> 
            */}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
