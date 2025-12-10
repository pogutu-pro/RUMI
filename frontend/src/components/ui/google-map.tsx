'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils/cn';

// Dynamically import react-map-gl/maplibre to avoid SSR issues
const Map = dynamic(
  () => import('react-map-gl/maplibre').then((mod) => mod.Map),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full bg-muted">
        <LoadingSpinner text="Loading Map" />
      </div>
    ),
  },
);

const Marker = dynamic(
  () => import('react-map-gl/maplibre').then((mod) => mod.Marker),
  {
    ssr: false,
  },
);

interface LatLng {
  lat: number;
  lng: number;
}

interface MapMarker {
  id: string | number;
  position: LatLng;
  title: string;
}

interface MapLibreMapProps extends React.HTMLAttributes<HTMLDivElement> {
  center: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  height?: string | number;
  width?: string | number;
  onMapClick?: (coords: LatLng) => void;
}

export function MapLibreMap({
  center,
  zoom = 14,
  markers = [],
  height = '400px',
  width = '100%',
  onMapClick,
  className,
  ...props
}: MapLibreMapProps) {
  const [loaded, setLoaded] = React.useState(false);

  const handleLoad = () => setLoaded(true);

  return (
    <div
      className={cn('rounded-xl overflow-hidden shadow-lg', className)}
      style={{ height, width }}
      {...props}
    >
      {!loaded && (
        <div className="flex items-center justify-center h-full w-full bg-muted">
          <LoadingSpinner text="Loading Map" />
        </div>
      )}

      <Map
        mapLib={maplibregl}
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom,
        }}
        mapStyle="https://demotiles.maplibre.org/style.json" // Free OpenStreetMap style
        style={{ height, width }}
        onLoad={handleLoad}
        onClick={(evt) => {
          if (evt.lngLat) {
            onMapClick?.({ lat: evt.lngLat.lat, lng: evt.lngLat.lng });
          }
        }}
      >
        {markers.map(({ id, position, title }) => (
          <Marker
            key={id}
            longitude={position.lng}
            latitude={position.lat}
            anchor="bottom"
            color="#007aff"
          >
            <div className="relative">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                {title}
              </div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}

export { MapLibreMap as GoogleMap };
export default MapLibreMap;
