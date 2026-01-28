'use client';

import * as React from 'react';
import { BrandedLoader } from '@/components/ui/branded-loader';
import { cn } from '@/lib/utils/cn';

interface LatLng {
  lat: number;
  lng: number;
}

interface MapMarker {
  id: string | number;
  position: LatLng;
  title: string;
}

interface GoogleMapProps extends React.HTMLAttributes<HTMLDivElement> {
  center: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  height?: string | number;
  width?: string | number;
  onMapClick?: (coords: LatLng) => void;
}

export function GoogleMap({
  center,
  zoom = 14,
  markers = [],
  height = '400px',
  width = '100%',
  onMapClick,
  className,
  ...props
}: GoogleMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        setError('Google Maps API key not found');
        setLoading(false);
        return;
      }

      try {
        // Load Google Maps script
        if (!window.google) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          document.head.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }
        
        if (mapRef.current && window.google) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          if (onMapClick) {
            mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
              if (e.latLng) {
                onMapClick({
                  lat: e.latLng.lat(),
                  lng: e.latLng.lng()
                });
              }
            });
          }

          // Add markers
          markers.forEach(({ position, title }) => {
            new google.maps.Marker({
              position,
              map: mapInstance,
              title,
            });
          });
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps');
      } finally {
        setLoading(false);
      }
    };

    initMap();
  }, [center.lat, center.lng, zoom, onMapClick, markers]);

  if (error) {
    return (
      <div
        className={cn('rounded-xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center', className)}
        style={{ height, width }}
        {...props}
      >
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-xl overflow-hidden shadow-lg', className)}
      style={{ height, width }}
      {...props}
    >
      {loading && (
        <div className="flex items-center justify-center h-full w-full bg-muted">
          <BrandedLoader text="Loading Map" />
        </div>
      )}
      <div ref={mapRef} style={{ height, width, display: loading ? 'none' : 'block' }} />
    </div>
  );
}

export default GoogleMap;
