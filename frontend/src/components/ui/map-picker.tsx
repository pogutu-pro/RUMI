'use client';

import * as React from 'react';
import maplibregl from 'maplibre-gl';
import { Map, Marker } from 'react-map-gl'; // React wrapper for MapLibre GL
import 'maplibre-gl/dist/maplibre-gl.css';
import { BrandedLoader } from '@/components/ui/branded-loader';
import { cn } from '@/lib/utils/cn';

interface LatLng {
  lat: number;
  lng: number;
}

interface MapPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  initialCenter: LatLng;
  currentLocation: LatLng;
  onLocationChange: (coords: LatLng) => void;
  zoom?: number;
  height?: string | number;
}

export function MapPicker({
  initialCenter,
  currentLocation,
  onLocationChange,
  zoom = 15,
  height = '400px',
  className,
  ...props
}: MapPickerProps) {
  const [loaded, setLoaded] = React.useState(false);

  const handleLoad = () => setLoaded(true);

  // Map viewport state could be controlled internally or lifted if needed
  const [viewport, setViewport] = React.useState({
    longitude: currentLocation.lng,
    latitude: currentLocation.lat,
    zoom,
  });

  // Sync viewport if currentLocation prop changes
  React.useEffect(() => {
    setViewport({
      longitude: currentLocation.lng,
      latitude: currentLocation.lat,
      zoom,
    });
  }, [currentLocation, zoom]);

  const onDragEnd = (evt: any) => {
    const { lngLat } = evt;
    onLocationChange({ lat: lngLat.lat, lng: lngLat.lng });
  };

  return (
    <div
      className={cn('relative rounded-xl shadow-lg', className)}
      style={{ height, width: '100%' }}
      {...props}
    >
      {!loaded && (
        <div className="flex items-center justify-center h-full w-full bg-muted rounded-xl">
          <BrandedLoader text="Loading Map" />
        </div>
      )}
      <Map
        mapLib={maplibregl}
        initialViewState={viewport}
        mapStyle="https://demotiles.maplibre.org/style.json" // Free OpenStreetMap style
        style={{ width: '100%', height }}
        onLoad={handleLoad}
        onMove={(evt) => setViewport(evt.viewState)}
        onDragEnd={onDragEnd}
        dragRotate={false}
      >
        <Marker
          longitude={viewport.longitude}
          latitude={viewport.latitude}
          draggable
          onDragEnd={onDragEnd}
          anchor="bottom"
          color="#007aff"
          title="Selected Location"
        />
      </Map>
    </div>
  );
}
