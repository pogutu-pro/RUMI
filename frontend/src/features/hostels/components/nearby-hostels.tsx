'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { hostelsApi } from '@/features/hostels';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface NearbyHostelsProps {
  city?: string;
  university?: string;
  currentHostelId: number;
}

export default function NearbyHostels({ city, university, currentHostelId }: NearbyHostelsProps) {
  const { data: response, isLoading } = useQuery({
    queryKey: ['nearby-hostels', city, university],
    queryFn: () => hostelsApi.getHostels({ city, university, page_size: 4 }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const nearby = response?.results?.filter((h: any) => h.id !== currentHostelId) || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (nearby.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {nearby.map((hostel: any, index: number) => (
        <motion.div
          key={hostel.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
        >
          <Link href={`/hostels/${hostel.slug || hostel.id}`}>
            <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-2xl bg-white">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={hostel.images?.[0] || '/placeholder-hostel.jpg'}
                  alt={hostel.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className="bg-white/90 backdrop-blur-md text-gray-900 border-0 font-bold">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
                    {parseFloat(hostel.rating || '0').toFixed(1)}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                    {hostel.name}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{hostel.city}</span>
                  </div>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <div>
                    <span className="text-lg font-black text-gray-900">KES {hostel.base_price}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider ml-1">/mo</span>
                  </div>
                  <Badge variant="outline" className="border-gray-100 text-gray-400 group-hover:border-emerald-200 group-hover:text-emerald-600 transition-colors">
                    View
                  </Badge>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
