'use client';

import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import GoogleMap from '@/components/ui/google-map'; 

interface HostelLocationMapProps {
  lat: number | null | undefined; 
  lng: number | null | undefined; 
  address: string;
  distanceToCampus: number;
}

export default function HostelLocationMap({
  lat,
  lng,
  address,
  distanceToCampus,
}: HostelLocationMapProps) {
  
  // Runtime Validation: Check if both coordinates are definite numbers.
  const isValidLocation = typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);

  // Use the valid numbers, otherwise provide a fallback.
  const validLat = isValidLocation ? (lat as number) : 0;
  const validLng = isValidLocation ? (lng as number) : 0;
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, ease: [0.21, 0.45, 0.32, 0.9] }}
      className="py-16 border-t border-gray-100"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-gray-900">
            Location Overview
          </h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full w-fit">
            <Navigation className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">
              {distanceToCampus} km from campus
            </span>
          </div>
        </div>
        
        <div className="flex items-start gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100 max-w-md">
          <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-gray-600 leading-relaxed">
            {address}
          </p>
        </div>
      </div>

      <div className="relative group">
        <div className="h-[450px] md:h-[550px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 transition-all duration-500 group-hover:shadow-emerald-500/10 group-hover:border-emerald-200/50">
          {isValidLocation ? (
            <GoogleMap
              center={{ lat: validLat, lng: validLng }}
              zoom={15}
              markers={[{ id: 'hostel-location', position: { lat: validLat, lng: validLng }, title: address }]}
              className="w-full h-full"
            />
          ) : (
            <div className="h-full w-full bg-gray-50 flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-white rounded-full shadow-sm">
                <MapPin className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-semibold tracking-tight">
                Location coordinates currently unavailable.
              </p>
            </div>
          )}
        </div>
        
        {/* Subtle decorative glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      </div>
    </motion.section>
  );
}