'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
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

/**
 * HostelCard - Airbnb-inspired hostel card with image carousel
 * Mobile-first with pixel-perfect design, smooth micro-animations, and swipe support
 */
export function HostelCard({
  hostel,
  onFavoriteToggle,
  isFavorite = false,
  className,
  basePath = '/hostels',
}: HostelCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [direction, setDirection] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
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

  const navigate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentImageIndex((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = images.length - 1;
      if (next >= images.length) next = 0;
      return next;
    });
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(1);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(-1);
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipe = Math.abs(offset.x) * velocity.x;

    if (swipe < -10000) {
      navigate(1);
    } else if (swipe > 10000) {
      navigate(-1);
    }
    setIsDragging(false); // Always reset after drag
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div
      className={cn('flex flex-col h-full gap-3 group', className)}
    >
      {/* Image Carousel Container */}
      <div
        className="relative aspect-[20/19] overflow-hidden rounded-xl bg-muted"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentImageIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            className="absolute inset-0 w-full h-full bg-muted"
          >
            <Link 
              href={`${basePath}/${hostel.slug ?? hostel.id}`}
              className="block w-full h-full cursor-pointer relative"
              draggable={false}
            >
              <Image
                src={images[currentImageIndex]}
                alt={`Photo of ${hostel.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                priority={false}
                draggable={false}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </motion.div>
        </AnimatePresence>
        
        {/* Top Overlay */}
        <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start pointer-events-none">
          {hostel.is_verified && (
            <Badge
              variant="secondary"
              className="bg-background/95 backdrop-blur-md text-xs font-semibold text-foreground border-0 shadow-lg px-3 py-1.5"
            >
              ✓ Verified
            </Badge>
          )}
          <div className="ml-auto pointer-events-auto">
            <FavoriteButton
              hostelId={String(hostel.id)}
              initialFavorited={isFavorite || hostel.isFavorited || false}
              hostel={hostel}
            />
          </div>
        </div>

        {/* Navigation Arrows - Elegant hover reveal */}
        {isHovered && images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/95 hover:bg-background shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 z-20"
              onClick={prevImage}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/95 hover:bg-background shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 z-20"
              onClick={nextImage}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </Button>
          </>
        )}

        {/* Pagination Dots - Subtle and modern */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDirection(idx > currentImageIndex ? 1 : -1);
                  setCurrentImageIndex(idx);
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300 backdrop-blur-sm',
                  idx === currentImageIndex
                    ? 'w-6 bg-white shadow-md'
                    : 'w-1.5 bg-white/60 hover:bg-white/80'
                )}
                aria-label={
                  idx === currentImageIndex
                    ? 'Current image'
                    : `Go to image ${idx + 1}`
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Content Section - Refined typography and spacing */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-start gap-2">
          <Link href={`${basePath}/${hostel.slug ?? hostel.id}`} className="block overflow-hidden">
             <h3 className="font-semibold text-[15px] text-foreground truncate leading-tight hover:underline">
               {hostel.city}, {hostel.university}
             </h3>
          </Link>
          <div className="flex items-center gap-1 text-sm shrink-0">
            <Star
              className="h-3.5 w-3.5 fill-foreground text-foreground"
              aria-label="Rating"
            />
            <span className="font-medium">{Number(rating).toFixed(1)}</span>
          </div>
        </div>
        <p className="text-muted-foreground text-[13px] truncate">
          {hostel.distance_from_university
            ? `${parseFloat(hostel.distance_from_university).toFixed(1)} km to campus`
            : 'Near campus'}
        </p>
        <p className="text-muted-foreground text-[13px] truncate">
          {availableRooms > 0
            ? `${availableRooms} rooms available`
            : 'Fully booked'}
        </p>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="font-semibold text-foreground text-[15px]">
            {currency} {Number(price).toLocaleString()}
          </span>
          <span className="text-muted-foreground text-[13px]">/ month</span>
        </div>
        
        <div className="flex gap-2 mt-2">
          <Link href={`${basePath}/${hostel.slug ?? hostel.id}`} className="flex-1">
            <Button className="w-full text-xs h-8" variant="outline">View Details</Button>
          </Link>
           <Button 
             variant={isInCompare ? "default" : "secondary"}
             className={cn(
               "flex-1 text-xs h-8 transition-colors",
                isInCompare 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               
               if (isInCompare) {
                  removeFromCompare(hostel.id);
                  toast.info('Removed from comparison');
               } else {
                  const added = addToCompare(hostel);
                  if (added) {
                      toast.success('Added to comparison');
                  } else {
                      toast.error('You can only compare up to 3 hostels');
                  }
               }
             }}
           >
             {isInCompare ? "Added" : "Compare"}
           </Button>
        </div>
      </div>
    </div>
  );
}
