/**
 * PWA Registration and Management
 * Service Worker registration with update handling
 */

export interface PWAUpdateEvent {
  type: 'update-available' | 'update-installed' | 'offline-ready';
  registration?: ServiceWorkerRegistration;
}

type PWAEventCallback = (event: PWAUpdateEvent) => void;

let updateCallback: PWAEventCallback | null = null;

/**
 * Register service worker
 */
export async function registerServiceWorker(onUpdate?: PWAEventCallback) {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers not supported');
    return null;
  }

  if (onUpdate) {
    updateCallback = onUpdate;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service worker registered:', registration.scope);

    // Check for updates every hour
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log('[PWA] New update available');
            updateCallback?.({
              type: 'update-available',
              registration,
            });
          } else {
            // Offline ready
            console.log('[PWA] App ready for offline use');
            updateCallback?.({
              type: 'offline-ready',
              registration,
            });
          }
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker (for debugging)
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const results = await Promise.all(
    registrations.map((registration) => registration.unregister())
  );

  console.log('[PWA] Service worker unregistered');
  return results.every((result) => result === true);
}

/**
 * Clear all caches
 */
export async function clearCaches() {
  if (!('caches' in window)) {
    return false;
  }

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));

  console.log('[PWA] All caches cleared');
  return true;
}

/**
 * Skip waiting and activate new service worker immediately
 */
export function skipWaiting(registration: ServiceWorkerRegistration) {
  const waiting = registration.waiting;
  if (!waiting) return;

  waiting.postMessage({ type: 'SKIP_WAITING' });

  // Reload page when new service worker takes over
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

/**
 * Check if app is running as PWA (installed)
 */
export function isRunningAsPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if PWA install is available
 */
export function isPWAInstallAvailable(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}

/**
 * Handle PWA install prompt
 */
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] Install prompt available');
});

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('[PWA] Install prompt not available');
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  console.log('[PWA] Install prompt outcome:', outcome);
  deferredPrompt = null;

  return outcome === 'accepted';
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  clearCaches,
  skipWaiting,
  isRunningAsPWA,
  isPWAInstallAvailable,
  promptPWAInstall,
};
