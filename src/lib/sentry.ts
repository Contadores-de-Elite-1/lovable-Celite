/**
 * Sentry Error Tracking Configuration
 * Lazy-loaded for production error monitoring
 */

interface SentryConfig {
  dsn: string;
  environment: 'development' | 'production' | 'staging';
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

/**
 * Initialize Sentry (call this in main.tsx)
 * Only loads in production to avoid dev noise
 */
export async function initSentry() {
  // Only in production
  if (import.meta.env.MODE !== 'production') {
    console.log('[Sentry] Skipped in development');
    return;
  }

  // Check if DSN is configured
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  try {
    // Lazy load Sentry to avoid bloating main bundle
    const Sentry = await import('@sentry/react');

    const config: SentryConfig = {
      dsn,
      environment: import.meta.env.MODE as any,

      // Performance monitoring - 10% of transactions
      tracesSampleRate: 0.1,

      // Session replay - 10% of sessions
      replaysSessionSampleRate: 0.1,

      // Session replay on error - 100% of errors
      replaysOnErrorSampleRate: 1.0,
    };

    Sentry.init({
      ...config,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Filter out sensitive data
      beforeSend(event) {
        // Remove sensitive data from URLs
        if (event.request?.url) {
          try {
            const url = new URL(event.request.url);
            url.searchParams.delete('token');
            url.searchParams.delete('key');
            event.request.url = url.toString();
          } catch (e) {
            // Invalid URL, keep as is
          }
        }

        // Remove cookies
        if (event.request?.cookies) {
          event.request.cookies = undefined;
        }

        return event;
      },

      // Ignore known non-critical errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',

        // Network errors
        'NetworkError',
        'Failed to fetch',
        'Load failed',

        // Stripe SDK errors (handled by our code)
        'stripe.redirectToCheckout',
      ],
    });

    console.log('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Capture exception manually
 */
export async function captureException(error: Error, context?: Record<string, any>) {
  if (import.meta.env.MODE !== 'production') {
    console.error('[Sentry] Exception:', error, context);
    return;
  }

  try {
    const Sentry = await import('@sentry/react');
    Sentry.captureException(error, { extra: context });
  } catch (e) {
    console.error('[Sentry] Failed to capture exception:', e);
  }
}

/**
 * Set user context
 */
export async function setUser(user: { id: string; email?: string } | null) {
  if (import.meta.env.MODE !== 'production') {
    return;
  }

  try {
    const Sentry = await import('@sentry/react');
    Sentry.setUser(user);
  } catch (e) {
    console.error('[Sentry] Failed to set user:', e);
  }
}

/**
 * Add breadcrumb
 */
export async function addBreadcrumb(
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' = 'info'
) {
  if (import.meta.env.MODE !== 'production') {
    return;
  }

  try {
    const Sentry = await import('@sentry/react');
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error('[Sentry] Failed to add breadcrumb:', e);
  }
}

export default {
  initSentry,
  captureException,
  setUser,
  addBreadcrumb,
};
