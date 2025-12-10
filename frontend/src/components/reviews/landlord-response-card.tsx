'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { LandlordResponse } from '@/types/entities.types';

interface LandlordResponseCardProps {
  response: LandlordResponse;
}

export default function LandlordResponseCard({ response }: LandlordResponseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 pl-4 border-l-2 border-blue-200 bg-blue-50/50 rounded-r-lg p-4"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 border-2 border-blue-200">
          <AvatarImage src={response.landlordAvatar} />
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
            {response.landlordName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-semibold text-blue-900">
              Response from {response.landlordName}
            </p>
            <p className="text-xs text-blue-600">
              {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
            </p>
          </div>
          
          <p className="text-sm text-gray-700 leading-relaxed">
            {response.text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
