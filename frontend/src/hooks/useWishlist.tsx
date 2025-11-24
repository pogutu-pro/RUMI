import { useState, useEffect, useCallback } from 'react';
import { marketplaceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface WishlistItem {
  id: number;
  product_id: number;
  title: string;
  price: number;
  condition: string;
  category: string;
  image_url: string;
  seller_name: string;
  added_at: string;
}

interface Wishlist {
  items: WishlistItem[];
  total_items: number;
}

interface UseWishlistReturn {
  wishlist: Wishlist | null;
  loading: boolean;
  error: string | null;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (itemId: number) => Promise<void>;
  removeFromWishlistByProductId: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WISHLIST_STORAGE_KEY = 'wishlist_data';

export const useWishlist = (): UseWishlistReturn => {
  const { isAuthenticated, user } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const storedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (storedWishlist) {
      try {
        const parsedWishlist = JSON.parse(storedWishlist);
        setWishlist(parsedWishlist);
      } catch (err) {
        console.error('Error parsing stored wishlist:', err);
        localStorage.removeItem(WISHLIST_STORAGE_KEY);
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (wishlist) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } else {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    }
  }, [wishlist]);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setWishlist(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await marketplaceAPI.getWishlist();
      setWishlist(response.data);
    } catch (err: any) {
      console.error('Error fetching wishlist:', err);
      setError(err.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Refresh wishlist when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshWishlist();
    } else {
      setWishlist(null);
    }
  }, [isAuthenticated, user, refreshWishlist]);

  const addToWishlist = useCallback(async (productId: number) => {
    if (!isAuthenticated || !user) {
      setError('Please login to add items to wishlist');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await marketplaceAPI.addToWishlist({ product_id: productId });
      await refreshWishlist(); // Refresh wishlist after adding
    } catch (err: any) {
      console.error('Error adding to wishlist:', err);
      setError(err.message || 'Failed to add item to wishlist');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, refreshWishlist]);

  const removeFromWishlist = useCallback(async (itemId: number) => {
    if (!isAuthenticated || !user) {
      setError('Please login to remove items from wishlist');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await marketplaceAPI.removeFromWishlist(itemId);
      await refreshWishlist(); // Refresh wishlist after removing
    } catch (err: any) {
      console.error('Error removing from wishlist:', err);
      setError(err.message || 'Failed to remove item from wishlist');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, refreshWishlist]);

  const removeFromWishlistByProductId = useCallback(async (productId: number) => {
    const item = wishlist?.items?.find(item => item.product_id === productId);
    if (item) {
      await removeFromWishlist(item.id);
    }
  }, [wishlist, removeFromWishlist]);

  const isInWishlist = useCallback((productId: number) => {
    return wishlist?.items?.some(item => item.product_id === productId) || false;
  }, [wishlist]);

  return {
    wishlist,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    removeFromWishlistByProductId,
    isInWishlist,
    refreshWishlist,
  };
};

export type { WishlistItem, Wishlist };