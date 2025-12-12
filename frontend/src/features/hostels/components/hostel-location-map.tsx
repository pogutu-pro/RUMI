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
  // Note: We cast these since isValidLocation confirms they are safe numbers.
  const validLat = isValidLocation ? (lat as number) : 0;
  const validLng = isValidLocation ? (lng as number) : 0;
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className="py-12 border-t border-gray-200"
    >
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
        Where you'll be
      </h2>

      <div className="h-[400px] md:h-[500px] rounded-xl overflow-hidden shadow-lg border border-gray-200 mb-6">
        {isValidLocation ? (
          <GoogleMap
            center={{ lat: validLat, lng: validLng }}
            zoom={15}
            markers={[{ id: 'hostel-location', position: { lat: validLat, lng: validLng }, title: address }]}
          />
        ) : (
          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500 font-medium">
              Map location unavailable due to missing coordinates.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <p className="text-base text-gray-700 leading-6">**{address}**</p>
        </div>
        <div className="flex items-center gap-3">
          <Navigation className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-base font-semibold text-green-600">
            **{distanceToCampus} km** to campus
          </p>
        </div>
      </div>
    </motion.section>
  );
}