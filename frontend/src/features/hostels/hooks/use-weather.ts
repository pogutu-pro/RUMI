'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface WeatherData {
  location_name: string;
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    description: string;
    icon: string;
    wind_speed: number;
  };
  forecast: Array<{
    date: string;
    temp_high: number;
    temp_low: number;
    description: string;
    icon: string;
  }>;
  last_updated: string;
}

/**
 * Hook to fetch weather data for specific coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @param enabled Whether the query should be enabled
 */
export function useWeather(lat?: number, lng?: number, enabled: boolean = true) {
  return useQuery<WeatherData>({
    queryKey: ['weather', lat, lng],
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/home/weather/`, {
        params: { lat, lng },
      });
      return data;
    },
    enabled: enabled && typeof lat === 'number' && typeof lng === 'number',
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });
}
