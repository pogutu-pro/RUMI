'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [ pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const threshold = 80; // Pull distance needed to trigger refresh

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const scrollTop = (e.target as HTMLElement).scrollTop || window.scrollY;
    
    // Only enable pull-to-refresh when at top of scroll
    if (scrollTop === 0 && !isRefreshing) {
      const currentTouch = e.touches[0].clientY;
      const distance = currentTouch - touchStart;

      if (distance > 0) {
        // Elastic effect: slow down pull as it gets longer
        const elastic = Math.min(distance * 0.5, 100);
        setPullDistance(elastic);
      }
    }
  }, [touchStart, isRefreshing]);

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  useEffect(() => {
    const container = document.getElementById('conversation-list');
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart as any);
    container.addEventListener('touchmove', handleTouchMove as any);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart as any);
      container.removeEventListener('touchmove', handleTouchMove as any);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchMove]);

  const rotation = (pullDistance / threshold) * 360;

  return (
    <div className="relative">
      {/* Pull Indicator */}
      {pullDistance > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: pullDistance / threshold }}
          className="absolute left-1/2 top-0 z-50 -translate-x-1/2"
          style={{ transform: `translateX(-50%) translateY(${pullDistance}px)` }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
            <RefreshCw
              className="h-6 w-6 text-white"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? 60 : 0}px)`,
          transition: 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}
