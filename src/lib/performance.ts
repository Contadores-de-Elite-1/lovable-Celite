/**
 * Performance Monitoring
 * Tracks Web Vitals and sends to analytics
 */

type Metric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
};

/**
 * Send performance metric to analytics
 */
function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify(metric);

  // Log in development
  if (import.meta.env.DEV) {
    console.log('[PERFORMANCE]', metric);
  }

  // Send to Google Analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Send to custom analytics endpoint (if configured)
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(console.error);
  }

  // Store locally for debugging (last 10 metrics)
  try {
    const stored = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
    stored.unshift({ ...metric, timestamp: Date.now() });
    localStorage.setItem('performance_metrics', JSON.stringify(stored.slice(0, 10)));
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Initialize performance monitoring
 * Call this once at app startup
 */
export async function initPerformanceMonitoring() {
  // Only in browser
  if (typeof window === 'undefined') return;

  try {
    // Dynamic import to avoid loading in SSR
    const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

    // Track all Web Vitals
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onINP(sendToAnalytics);

    console.log('[PERFORMANCE] Monitoring initialized');
  } catch (error) {
    console.warn('[PERFORMANCE] Failed to load web-vitals', error);
  }
}

/**
 * Mark custom performance event
 */
export function markPerformance(name: string) {
  if (typeof window === 'undefined' || !window.performance) return;

  try {
    window.performance.mark(name);
  } catch (e) {
    console.warn(`[PERFORMANCE] Failed to mark: ${name}`, e);
  }
}

/**
 * Measure time between two marks
 */
export function measurePerformance(name: string, startMark: string, endMark: string) {
  if (typeof window === 'undefined' || !window.performance) return;

  try {
    window.performance.measure(name, startMark, endMark);
    const measure = window.performance.getEntriesByName(name)[0];

    if (measure) {
      console.log(`[PERFORMANCE] ${name}: ${measure.duration.toFixed(2)}ms`);

      // Send to analytics
      if ((window as any).gtag) {
        (window as any).gtag('event', 'timing_complete', {
          name,
          value: Math.round(measure.duration),
          event_category: 'Custom Timing',
        });
      }
    }
  } catch (e) {
    console.warn(`[PERFORMANCE] Failed to measure: ${name}`, e);
  }
}

/**
 * Get current performance metrics
 * Useful for debugging
 */
export function getPerformanceMetrics() {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('performance_metrics');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Report long task
 */
export function reportLongTask(duration: number, name?: string) {
  if (duration > 50) { // Tasks longer than 50ms
    console.warn(`[PERFORMANCE] Long task detected: ${name || 'unknown'} (${duration.toFixed(2)}ms)`);

    if ((window as any).gtag) {
      (window as any).gtag('event', 'long_task', {
        event_category: 'Performance',
        value: Math.round(duration),
        event_label: name || 'unknown',
      });
    }
  }
}

// Auto-initialize in production
if (import.meta.env.PROD) {
  initPerformanceMonitoring();
}

export default {
  initPerformanceMonitoring,
  markPerformance,
  measurePerformance,
  getPerformanceMetrics,
  reportLongTask,
};
