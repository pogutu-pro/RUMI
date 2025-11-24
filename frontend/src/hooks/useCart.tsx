import { useState, useEffect, useCallback } from 'react';
import { marketplaceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface CartItem {
  id: number;
  product_id: number;
  title: string;
  price: number;
  quantity: number;
  image_url: string;
  seller_name: string;
  condition: string;
  category: string;
}

interface Cart {
  items: CartItem[];
  total_items: number;
  subtotal: number;
  tax: number;
  total: number;
}

interface UseCartReturn {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

const CART_STORAGE_KEY = 'cart_data';

export const useCart = (): UseCartReturn => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        setCart(parsedCart);
      } catch (err) {
        console.error('Error parsing stored cart:', err);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [cart]);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCart(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await marketplaceAPI.getCart();
      setCart(response.data);
    } catch (err: any) {
      console.error('Error fetching cart:', err);
      setError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Refresh cart when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated, user, refreshCart]);

  const addToCart = useCallback(async (productId: number, quantity: number = 1) => {
    if (!isAuthenticated || !user) {
      setError('Please login to add items to cart');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await marketplaceAPI.addToCart({ product_id: productId, quantity });
      await refreshCart(); // Refresh cart after adding
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      setError(err.message || 'Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, refreshCart]);

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    if (!isAuthenticated || !user) {
      setError('Please login to update cart');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await marketplaceAPI.updateCartItem(itemId, { quantity });
      await refreshCart(); // Refresh cart after updating
    } catch (err: any) {
      console.error('Error updating cart item:', err);
      setError(err.message || 'Failed to update item quantity');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, refreshCart]);

  const removeItem = useCallback(async (itemId: number) => {
    if (!isAuthenticated || !user) {
      setError('Please login to remove items from cart');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await marketplaceAPI.removeCartItem(itemId);
      await refreshCart(); // Refresh cart after removing
    } catch (err: any) {
      console.error('Error removing cart item:', err);
      setError(err.message || 'Failed to remove item from cart');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, refreshCart]);

  const clearCart = useCallback(() => {
    setCart(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  return {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
  };
};

export type { CartItem, Cart };