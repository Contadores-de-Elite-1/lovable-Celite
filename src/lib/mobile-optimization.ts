/**
 * Mobile Optimization Utilities
 * Performance and UX optimizations for mobile devices
 */

/**
 * Detect mobile device
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Detect iOS device
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Detect Android device
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Get viewport dimensions
 */
export function getViewport() {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
  };
}

/**
 * Check if in landscape mode
 */
export function isLandscape(): boolean {
  return window.matchMedia('(orientation: landscape)').matches;
}

/**
 * Disable bounce scroll on iOS
 */
export function disableIOSBounce() {
  if (!isIOS()) return;

  document.body.style.overscrollBehavior = 'none';
  document.documentElement.style.overscrollBehavior = 'none';
}

/**
 * Enable passive event listeners for better scroll performance
 */
export function enablePassiveListeners() {
  // Override addEventListener to make touch/wheel events passive by default
  const supportsPassive = detectPassiveSupport();
  if (!supportsPassive) return;

  const addEvent = EventTarget.prototype.addEventListener;
  const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];

  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: any,
    options?: any
  ) {
    const isPassiveEvent = passiveEvents.includes(type);
    const optionsWithPassive =
      typeof options === 'object' && options !== null
        ? { ...options, passive: options.passive ?? isPassiveEvent }
        : isPassiveEvent
        ? { passive: true }
        : options;

    return addEvent.call(this, type, listener, optionsWithPassive);
  };
}

function detectPassiveSupport(): boolean {
  let passiveSupported = false;
  try {
    const options = {
      get passive() {
        passiveSupported = true;
        return false;
      },
    };
    window.addEventListener('test', null as any, options);
    window.removeEventListener('test', null as any, options);
  } catch (err) {
    passiveSupported = false;
  }
  return passiveSupported;
}

/**
 * Optimize images for mobile (lazy loading hint)
 */
export function optimizeImages() {
  // Add loading="lazy" to images without it
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach((img) => {
    img.setAttribute('loading', 'lazy');
  });

  // Add decoding="async" for faster rendering
  const allImages = document.querySelectorAll('img:not([decoding])');
  allImages.forEach((img) => {
    img.setAttribute('decoding', 'async');
  });
}

/**
 * Prevent zoom on input focus (iOS)
 */
export function preventInputZoom() {
  if (!isIOS()) return;

  // Set viewport meta to prevent zoom
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    );
  }
}

/**
 * Add tap highlight color (Android)
 */
export function optimizeTapHighlight() {
  document.documentElement.style.webkitTapHighlightColor = 'transparent';
}

/**
 * Optimize font loading
 */
export function optimizeFonts() {
  // Use font-display: swap for better performance
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Detect connection type (slow connection warning)
 */
export function getConnectionType(): {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
} | null {
  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection) return null;

  return {
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false,
  };
}

/**
 * Check if on slow connection
 */
export function isSlowConnection(): boolean {
  const connection = getConnectionType();
  if (!connection) return false;

  return (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.saveData
  );
}

/**
 * Reduce motion for accessibility
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Initialize all mobile optimizations
 */
export function initMobileOptimizations() {
  console.log('[Mobile] Initializing optimizations...');

  // Detect device
  const mobile = isMobile();
  const ios = isIOS();
  const android = isAndroid();
  const slowConnection = isSlowConnection();

  console.log('[Mobile] Device:', { mobile, ios, android, slowConnection });

  // Apply optimizations
  if (mobile) {
    disableIOSBounce();
    optimizeTapHighlight();
    optimizeImages();
  }

  if (ios) {
    preventInputZoom();
  }

  // Always apply
  enablePassiveListeners();
  optimizeFonts();

  // Warn if slow connection
  if (slowConnection) {
    console.warn('[Mobile] Slow connection detected');
  }

  console.log('[Mobile] Optimizations applied');

  return {
    mobile,
    ios,
    android,
    slowConnection,
    viewport: getViewport(),
    landscape: isLandscape(),
    reducedMotion: prefersReducedMotion(),
  };
}

/**
 * Vibration API (for haptic feedback)
 */
export function vibrate(pattern: number | number[]): boolean {
  if (!('vibrate' in navigator)) return false;

  try {
    return navigator.vibrate(pattern);
  } catch (e) {
    return false;
  }
}

/**
 * Share API (for native sharing)
 */
export async function share(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  if (!('share' in navigator)) {
    console.warn('[Mobile] Web Share API not supported');
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      console.error('[Mobile] Share failed:', e);
    }
    return false;
  }
}

export default {
  isMobile,
  isIOS,
  isAndroid,
  getViewport,
  isLandscape,
  getConnectionType,
  isSlowConnection,
  prefersReducedMotion,
  initMobileOptimizations,
  vibrate,
  share,
};
