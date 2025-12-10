/**
 * Mobile-specific utility functions for device detection,
 * viewport checks, and touch interactions
 */

/**
 * Check if current device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if current device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * Check if viewport width is mobile (< 768px)
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Check if viewport width is tablet (768px - 1024px)
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * Check if viewport width is desktop (>= 1024px)
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
}

/**
 * Check if viewport is small mobile (360px)
 */
export function is360px(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 360 && window.innerWidth < 576;
}

/**
 * Get safe area insets for modern mobile devices
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
  };
}

/**
 * Prevent scroll on body (useful for modals on mobile)
 */
export function disableBodyScroll(): void {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
}

/**
 * Re-enable scroll on body
 */
export function enableBodyScroll(): void {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
}

/**
 * Detect touch device
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get viewport height accounting for mobile browser chrome
 */
export function getViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.visualViewport?.height || window.innerHeight;
}

/**
 * Check if keyboard is likely open on mobile
 */
export function isKeyboardOpen(): boolean {
  if (typeof window === 'undefined') return false;
  const viewportHeight = getViewportHeight();
  const windowHeight = window.innerHeight;
  // Keyboard is likely open if viewport height is significantly less than window height
  return viewportHeight < windowHeight * 0.75;
}
