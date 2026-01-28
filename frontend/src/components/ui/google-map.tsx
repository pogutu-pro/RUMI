'use client';

import * as React from 'react';
import { Map, AdvancedMarker, Pin, MapControl, ControlPosition } from '@vis.gl/react-google-maps';
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
  mapId?: string;
}

/**
 * Enterprise-grade Google Maps component.
 * Uses the latest AdvancedMarker for performance and customization.
 */
export function GoogleMap({
  center,
  zoom = 14,
  markers = [],
  height = '400px',
  width = '100%',
  onMapClick,
  className,
  mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
  ...props
}: GoogleMapProps) {
  const [isTilesLoaded, setIsTilesLoaded] = React.useState(false);

  // Handle map interaction
  const handleMapClick = (e: any) => {
    if (onMapClick && e.detail.latLng) {
      onMapClick({
        lat: e.detail.latLng.lat,
        lng: e.detail.latLng.lng,
      });
    }
  };

  return (
    <div
      className={cn('relative rounded-xl overflow-hidden shadow-lg border border-border bg-muted', className)}
      style={{ height, width }}
      {...props}
    >
      {/* Branded Loading Overlay */}
      {!isTilesLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300">
          <BrandedLoader size={48} text="Initializing Map..." />
        </div>
      )}

      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId={mapId}
        onTilesLoaded={() => setIsTilesLoaded(true)}
        onClick={handleMapClick}
        disableDefaultUI={false}
        gestureHandling={'greedy'}
        reuseMaps={true}
        className="h-full w-full"
      >
        {/* Render Advanced Markers */}
        {markers.map((marker) => (
          <AdvancedMarker
            key={marker.id}
            position={marker.position}
            title={marker.title}
          >
            <Pin
              background={'#007aff'}
              borderColor={'#005bb7'}
              glyphColor={'#ffffff'}
              scale={1.2}
            />
          </AdvancedMarker>
        ))}

        {/* Custom Controls (Optional: Add common features like "Back to Center" if needed) */}
        <MapControl position={ControlPosition.TOP_LEFT}>
          <div className="m-3">
             {/* Future: Add search or filters here if needed */}
          </div>
        </MapControl>
      </Map>
    </div>
  );
}

export default GoogleMap;
