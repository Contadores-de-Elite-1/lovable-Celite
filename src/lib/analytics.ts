/**
 * Analytics Tracking
 * Simple event tracking for checkout funnel and user behavior
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

/**
 * Track custom events
 */
export function trackEvent(event: string, properties?: Record<string, any>) {
  const analyticsEvent: AnalyticsEvent = {
    event,
    properties: {
      ...properties,
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    },
    timestamp: Date.now(),
  };

  // Console log for development
  console.log('[ANALYTICS]', analyticsEvent);

  // Send to backend (implement later if needed)
  // You can integrate with Google Analytics, Mixpanel, etc.
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, properties);
  }

  // Store locally for debugging (last 10 events)
  try {
    const recentEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    recentEvents.unshift(analyticsEvent);
    localStorage.setItem('analytics_events', JSON.stringify(recentEvents.slice(0, 10)));
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Checkout Funnel Events
 */
export const CheckoutEvents = {
  VIEWED_PRICING: 'checkout_viewed_pricing',
  CLICKED_SUBSCRIBE: 'checkout_clicked_subscribe',
  SESSION_CREATED: 'checkout_session_created',
  REDIRECTED_TO_STRIPE: 'checkout_redirected_to_stripe',
  SUCCESS: 'checkout_success',
  CANCELLED: 'checkout_cancelled',
  ERROR: 'checkout_error',
} as const;

/**
 * Page View Events
 */
export const PageEvents = {
  PAGE_VIEW: 'page_view',
  SESSION_START: 'session_start',
} as const;

/**
 * Track page view
 */
export function trackPageView(pageName: string) {
  trackEvent(PageEvents.PAGE_VIEW, { page: pageName });
}

/**
 * Track checkout funnel step
 */
export function trackCheckoutStep(step: string, metadata?: Record<string, any>) {
  trackEvent(step, {
    funnel: 'checkout',
    ...metadata,
  });
}

export default {
  trackEvent,
  trackPageView,
  trackCheckoutStep,
  CheckoutEvents,
  PageEvents,
};
