import { useEffect } from 'react';

/**
 * Hook to handle mobile keyboard events and adjust layout
 * Prevents white gap bugs and ensures smooth keyboard animations
 */
export function useKeyboardHeight() {
  useEffect(() => {
    const handleResize = () => {
      // Set CSS custom property for actual viewport height
      // This accounts for mobile browser chrome
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
}

/**
 * Detect if keyboard is open (mobile)
 */
export function useKeyboardOpen(callback: (isOpen: boolean) => void) {
  useEffect(() => {
    let initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = initialHeight - currentHeight;

      // Keyboard is likely open if height decreased by more than 150px
      const isKeyboardOpen = heightDiff > 150;
      callback(isKeyboardOpen);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [callback]);
}
