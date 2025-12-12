'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HostelCard } from '@/features/hostels';
import { useStudentStore } from '@/features/student';

export default function FavoritesPage() {
  const router = useRouter();
  const favorites = useStudentStore((state) => state.favorites);
  
  // Empty State Component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <Heart className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-foreground">
        Your favorites list is empty
      </h2>
      <p className="text-muted-foreground max-w-sm mb-8">
        Your future room is somewhere out there — save a few favorites as you explore.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.push('/student/hostels')}>
          Explore Hostels
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <h1 className="text-lg font-bold text-foreground">Favorites</h1>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-5xl mx-auto">
        {favorites.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {favorites.map((hostel) => (
              <motion.div
                key={hostel.id}
                layout
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-[380px]" // Fixed height for consistency
              >
                <HostelCard hostel={hostel} basePath="/student/hostels" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
