'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  X,
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Grid3x3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HostelGalleryProps {
  images: string[];
  hostelName?: string;
}

/**
 * HostelGallery - Airbnb-inspired photo gallery
 * Large primary image with grid of thumbnails
 * Full-screen lightbox with keyboard navigation and mobile swipe support
 */
export default function HostelGallery({ images, hostelName }: HostelGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);

  if (!images.length) return null;

  const visibleImages = images.slice(0, 5);
  const remainingCount = images.length - 5;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const navigate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = images.length - 1;
      if (nextIndex >= images.length) nextIndex = 0;
      return nextIndex;
    });
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipe = Math.abs(offset.x) * velocity.x;

    if (swipe < -10000) {
      navigate(1);
    } else if (swipe > 10000) {
      navigate(-1);
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'Escape') setLightboxOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <>
      {/* Gallery Grid - Airbnb Style */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-4 md:grid-rows-2 gap-2 h-[400px] lg:h-[500px] rounded-xl overflow-hidden">
          {/* Large primary image - left side */}
          <button
            onClick={() => openLightbox(0)}
            className="col-span-2 row-span-2 relative group overflow-hidden"
          >
            <Image
              src={images[0]}
              alt={hostelName ? `${hostelName} - Main photo` : 'Main photo'}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </button>

          {/* Grid of 4 smaller images - right side */}
          {visibleImages.slice(1).map((img, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i + 1)}
              className="relative group overflow-hidden"
            >
              <Image
                src={img}
                alt={`Photo ${i + 2}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              
              {/* Show more overlay on last image */}
              {i === 3 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold">
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5" />
                    <span>+{remainingCount} photos</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Mobile: Single large image */}
        <div className="md:hidden relative aspect-[4/3] rounded-xl overflow-hidden">
          <button
            onClick={() => openLightbox(0)}
            className="w-full h-full relative"
          >
            <Image
              src={images[0]}
              alt={hostelName ? `${hostelName} - Main photo` : 'Main photo'}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </button>
        </div>

        {/* View all photos button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => openLightbox(0)}
          className="absolute bottom-4 right-4 gap-2 bg-white hover:bg-gray-100 shadow-lg border border-gray-200 font-semibold"
        >
          <Grid3x3 className="h-4 w-4" />
          <span className="hidden sm:inline">Show all photos</span>
          <span className="sm:hidden">Photos</span>
        </Button>
      </motion.div>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black/95 border-0">
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Image counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-white text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </p>
            </div>

            {/* Main image with swipe */}
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
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
                onDragEnd={handleDragEnd}
                className="absolute w-full h-full flex items-center justify-center"
              >
                <div className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto">
                  <Image
                    src={images[currentIndex]}
                    alt={`Photo ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    draggable={false}
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons (Desktop) */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-12 w-12 z-50"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(1)}
                  className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-12 w-12 z-50"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Thumbnail strip (desktop only) */}
            <div className="hidden lg:block absolute bottom-4 left-0 right-0 px-4 z-50">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-center">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDirection(i > currentIndex ? 1 : -1);
                        setCurrentIndex(i);
                      }}
                      className={cn(
                        'relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all',
                        i === currentIndex
                          ? 'ring-2 ring-white opacity-100'
                          : 'opacity-60 hover:opacity-80'
                      )}
                    >
                      <Image
                        src={img}
                        alt={`Thumbnail ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
