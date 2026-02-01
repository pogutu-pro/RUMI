'use client';

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
    <section className="py-12 border-t border-border/60">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-gray-900">
            Location Overview
          </h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-none w-fit">
            <Navigation className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">
              {distanceToCampus} km from campus
            </span>
          </div>
        </div>
        
        <div className="flex items-start gap-3 bg-muted/30 p-4 rounded-none border border-border max-w-md">
          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {address}
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="h-[450px] md:h-[550px] overflow-hidden border-2 border-border">
          {isValidLocation ? (
            <GoogleMap
              center={{ lat: validLat, lng: validLng }}
              zoom={15}
              markers={[{ id: 'hostel-location', position: { lat: validLat, lng: validLng }, title: address }]}
              className="w-full h-full"
            />
          ) : (
            <div className="h-full w-full bg-muted/20 flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-background border border-border">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-semibold tracking-tight">
                Location coordinates currently unavailable.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}