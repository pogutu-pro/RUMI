import { motion } from 'framer-motion';
import { Star, MapPin, ShieldCheck, Share, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FavoriteButton from './favorite-button';
import { cn } from '@/lib/utils';
import type { Hostel } from '@/types/entities.types';

interface HostelHeroProps {
  hostel: Hostel;
  className?: string;
}

export default function HostelHero({ hostel, className }: HostelHeroProps) {
  const rating = parseFloat(hostel.rating || '0');
  const hasRating = rating > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('pb-8 md:pb-10', className)}
    >
      <div className="flex flex-col gap-5">
        {/* Title Section */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
              {hostel.name}
            </h1>
            
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {hasRating && (
                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 px-3 py-1.5 text-sm font-semibold shadow-md hover:shadow-lg transition-shadow">
                  <Star className="h-3.5 w-3.5 fill-white mr-1.5" />
                  {rating.toFixed(1)} · {hostel.review_count} reviews
                </Badge>
              )}
              
              {hostel.is_verified && (
                <Badge className="bg-white border-2 border-emerald-200 text-emerald-700 px-3 py-1.5 text-sm font-semibold hover:bg-emerald-50 transition-colors">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
             <Button 
               variant="ghost" 
               size="sm" 
               className="hidden sm:flex gap-2 text-gray-700 hover:bg-gray-100 rounded-xl font-medium group"
             >
               <Share className="h-4 w-4 group-hover:scale-110 transition-transform" />
               Share
             </Button>
             <FavoriteButton
              hostelId={String(hostel.id)}
              initialFavorited={!!hostel.is_favorited}
              size="default"
            />
          </div>
        </div>
        
        {/* Location & Info Row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:text-base">
          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors group">
            <MapPin className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium underline decoration-gray-300 underline-offset-2 group-hover:decoration-gray-600">{hostel.address}, {hostel.city}</span>
          </div>

          {/* Distance to campus */}
          {hostel.distance_from_university && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600 font-medium">
                {parseFloat(hostel.distance_from_university).toFixed(1)} km from campus
              </span>
            </>
          )}
        </div>
      </div>
    </motion.section>
  );
}
