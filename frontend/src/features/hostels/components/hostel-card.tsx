'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import FavoriteButton from './favorite-button';
import { useStudentStore } from '@/features/student';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Hostel } from '@/types/entities.types';

interface HostelCardProps {
  hostel: Hostel;
  onFavoriteToggle?: (id: number) => void;
  isFavorite?: boolean;
  className?: string;
  basePath?: string;
}

export function HostelCard({
  hostel,
  onFavoriteToggle,
  isFavorite = false,
  className,
  basePath = '/hostels',
}: HostelCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const { addToCompare, removeFromCompare, isInCompare: checkInCompare } = useStudentStore();
  const isInCompare = checkInCompare(hostel.id);

  const images = hostel.images?.length
    ? hostel.images
    : ['/images/cards/card-01.jpg'];
  const price = hostel.base_price
    ? parseFloat(hostel.base_price)
    : (hostel.pricePerMonth ?? 0);
  const rating = hostel.rating ? parseFloat(hostel.rating) : 0;
  const availableRooms = hostel.available_rooms ?? hostel.roomsLeft ?? 0;
  const currency = hostel.currency ?? 'KSh';

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInCompare) {
      removeFromCompare(hostel.id);
    } else {
      const added = addToCompare(hostel);
      if (!added) {
        toast.error('Maximum 3 items allowed in comparison');
      }
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow', className)}>
      {/* Image Carousel */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden group">
        <Link 
            href={`${basePath}/${hostel.slug ?? hostel.id}`}
            className="block w-full h-full"
        >
            <Image
                src={images[currentImageIndex]}
                alt={hostel.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        </Link>
        
        {/* Top Overlay */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {hostel.is_verified && (
            <Badge className="bg-background/90 text-foreground border-none text-[10px] font-black uppercase tracking-wider px-2 py-1 shadow-sm">
              <Check className="h-3 w-3 mr-1 text-primary" strokeWidth={3} /> Verified
            </Badge>
          )}
          <div className="ml-auto">
            <FavoriteButton
              hostelId={String(hostel.id)}
              initialFavorited={isFavorite || hostel.isFavorited || false}
              hostel={hostel}
            />
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 shadow-sm backdrop-blur-sm pointer-events-auto"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 shadow-sm backdrop-blur-sm pointer-events-auto"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Pagination Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-full">
            {images.slice(0, 5).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  idx === currentImageIndex
                    ? 'w-4 bg-white'
                    : 'w-1 bg-white/50'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-start gap-4">
            <Link href={`${basePath}/${hostel.slug ?? hostel.id}`} className="block flex-1 min-w-0">
               <h3 className="font-bold text-lg text-foreground truncate hover:text-primary transition-colors">
                 {hostel.name}
               </h3>
            </Link>
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
              <Star className="h-3.5 w-3.5 text-foreground fill-foreground" />
              <span className="text-xs font-bold">{Number(rating).toFixed(1)}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-70">
            {hostel.city} • {hostel.university}
          </p>
        </div>

        <div className="space-y-2 border-t border-border/50 pt-4">
            <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">Location</span>
                <span className="text-foreground">
                    {hostel.distance_from_university
                        ? `${parseFloat(hostel.distance_from_university).toFixed(1)} km to campus`
                        : 'Near campus'}
                </span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">Availability</span>
                <span className={cn(
                    availableRooms > 0 ? "text-emerald-600 font-bold" : "text-destructive font-bold"
                )}>
                    {availableRooms > 0 ? `${availableRooms} Units Available` : 'Fully Occupied'}
                </span>
            </div>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between border-t border-border/50 mt-4 pt-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase opacity-70">Monthly Rate</span>
            <span className="font-black text-xl text-foreground">
                {currency} {Number(price).toLocaleString()}
            </span>
          </div>
          
          <div className="flex gap-2">
             <Button 
               variant={isInCompare ? "default" : "outline"}
               size="sm"
               className={cn(
                 "font-bold h-9 border-border/50",
                  isInCompare && "bg-primary text-primary-foreground"
                )}
               onClick={handleCompareClick}
             >
               {isInCompare ? "Comparing" : "Compare"}
             </Button>
             <Button asChild size="sm" className="font-bold h-9 px-4">
                <Link href={`${basePath}/${hostel.slug ?? hostel.id}`}>View</Link>
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
