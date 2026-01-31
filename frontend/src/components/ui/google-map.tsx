'use client';

import * as React from 'react';
import { Map, AdvancedMarker, Pin, MapControl, ControlPosition } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  CloudLightning, 
  Wind, 
  Thermometer,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { BrandedLoader } from '@/components/ui/branded-loader';
import { cn } from '@/lib/utils/cn';
import { useWeather } from '@/features/hostels/hooks/use-weather';
import { Button } from '@/components/ui/button';

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
  showWeather?: boolean;
}

const SILVER_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
  { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
];

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
  showWeather = true,
  ...props
}: GoogleMapProps) {
  const [isTilesLoaded, setIsTilesLoaded] = React.useState(false);
  const { data: weather, isLoading: isWeatherLoading } = useWeather(center.lat, center.lng, showWeather && isTilesLoaded);

  // Safety timeout: ensure loading overlay disappears even if map tiles fail
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!isTilesLoaded) {
        console.warn("Map tiles took too long to load, forcing transition.");
        setIsTilesLoaded(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [isTilesLoaded]);

  // Handle map interaction
  const handleMapClick = (e: any) => {
    if (onMapClick && e.detail.latLng) {
      onMapClick({
        lat: e.detail.latLng.lat,
        lng: e.detail.latLng.lng,
      });
    }
  };

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('rain')) return <CloudRain className="h-5 w-5 text-blue-500" />;
    if (desc.includes('cloud')) return <Cloud className="h-5 w-5 text-gray-400" />;
    if (desc.includes('storm') || desc.includes('lightning')) return <CloudLightning className="h-5 w-5 text-yellow-500" />;
    if (desc.includes('wind')) return <Wind className="h-5 w-5 text-emerald-500" />;
    return <Sun className="h-5 w-5 text-amber-500" />;
  };

  return (
    <div
      className={cn('relative rounded-xl overflow-hidden shadow-sm border border-border bg-muted', className)}
      style={{ height, width }}
      {...props}
    >
      {/* Flat Loading Overlay */}
      {!isTilesLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card transition-opacity duration-200">
          <BrandedLoader size={48} text="Loading map data..." />
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
        styles={SILVER_MAP_STYLE}
      >
        {/* Render Advanced Markers */}
        {markers.map((marker) => (
          <AdvancedMarker
            key={marker.id}
            position={marker.position}
            title={marker.title}
          >
            <Pin
              background={'#10b981'} // Emerald-500 matching RUMI brand
              borderColor={'#059669'} // Emerald-600
              glyphColor={'#ffffff'}
              scale={1.4}
            />
          </AdvancedMarker>
        ))}

        {/* Weather Overlay */}
        {showWeather && weather && (
          <MapControl position={ControlPosition.TOP_RIGHT}>
            <div className="m-3 p-3 bg-white rounded-lg shadow-sm border border-border flex flex-col gap-2 min-w-[140px]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Weather</span>
                  <div className="flex items-center gap-1">
                    <Thermometer className="h-3 w-3 text-emerald-500" />
                    <span className="text-lg font-black text-gray-900 leading-tight">
                      {Math.round(weather.current.temp)}°C
                    </span>
                  </div>
                </div>
                {getWeatherIcon(weather.current.description)}
              </div>
              <div className="h-px bg-gray-100 w-full" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium text-gray-600 capitalize">
                  {weather.current.description}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Wind className="h-2.5 w-2.5 text-gray-400" />
                  <span className="text-[9px] text-gray-500 font-medium">
                    {weather.current.wind_speed} m/s
                  </span>
                </div>
              </div>
            </div>
          </MapControl>
        )}

        {/* Action Controls */}
        <MapControl position={ControlPosition.BOTTOM_LEFT}>
          <div className="m-3 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white hover:bg-gray-50 text-gray-700 h-8 px-3 rounded-md shadow-sm border-border font-semibold text-xs gap-1.5"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Directions
            </Button>
          </div>
        </MapControl>
      </Map>
    </div>
  );
}

export default GoogleMap;
