'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toggleFavoriteHostel } from '@/lib/api/hostels';
import { useAuth } from '@/hooks/use-auth';
import { useStudentStore } from '@/stores/useStudentStore';
import { Hostel } from '@/types/entities.types';

interface FavoriteButtonProps {
  hostelId: string;
  initialFavorited: boolean;
  size?: 'sm' | 'default' | 'lg';
  hostel?: Hostel; // Optional hostel object for optimistic updates
}

/**
 * FavoriteButton - Requires authentication to add to wishlist
 * Unauthenticated users are redirected to login, then to dashboard wishlist
 */
export default function FavoriteButton({
  hostelId,
  initialFavorited,
  size = 'default',
  hostel,
}: FavoriteButtonProps) {
  // Use store for immediate UI updates
  const { isFavorite, addFavorite, removeFavorite, favorites } = useStudentStore();
  const isFavorited = useStudentStore((state) => state.isFavorite(Number(hostelId)));

  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Optimistic UI update via store + Backend Sync
  const mutation = useMutation({
    mutationFn: () => toggleFavoriteHostel(hostelId),
    onSuccess: (data) => {
      // Backend confirmed
      queryClient.invalidateQueries({ queryKey: ['hostel', hostelId] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
       // Revert store on error if needed, but for now just toast
       toast.error('Failed to sync wishlist with server');
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Please log in to save hostels to your wishlist');
      const returnUrl = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Immediate Store Update (Optimistic)
    if (isFavorited) {
        removeFavorite(Number(hostelId));
        toast.info('Removed from favorites');
    } else {
        if (hostel) {
          addFavorite(hostel);
          toast.success('Added to favorites');
        } else {
           // Fallback to minimal object if necessary or just wait for backend
           // Ideally we should have the full object. 
           // If we don't have it, we can't reliably add to the store list for display.
           // In this case, we rely on the query invalidation to fetch the updated list.
           // However, to make the button state update instantly, the store "isFavorite" check needs to return true.
           // We can add a partial object or just handle the ID in a "favoritedIds" set if we wanted to separate concerns,
           // but our store design uses a list of Hostel objects. "isFavorite" checks that list.
           // So for immediate feedback if "hostel" is missing, we might have a gap.
           // But HostelCard *does* have the hostel object.
           console.warn("FavoriteButton: 'hostel' prop missing, optimistic update might be limited.");
        }
    }
    mutation.mutate();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={mutation.isPending}
      aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
      className={cn(
        'h-8 w-8 rounded-full hover:bg-transparent text-white/70 hover:text-white transition-all active:scale-90',
        mutation.isPending && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Heart
        className={cn(
          'h-6 w-6 drop-shadow-md transition-all',
          isFavorited
            ? 'fill-emerald-500 text-emerald-500 scale-110'
            : 'fill-black/50 text-white stroke-[2px]',
          mutation.isPending && 'animate-pulse'
        )}
      />
    </Button>
  );
}
