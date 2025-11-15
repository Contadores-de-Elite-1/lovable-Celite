/**
 * Stripe Configuration
 * Centralized configuration for Stripe integration
 */

export const STRIPE_CONFIG = {
  // Redirect URLs
  CHECKOUT_SUCCESS_URL: '/checkout-confirmation?checkout=success',
  CHECKOUT_CANCEL_URL: '/checkout-confirmation?checkout=cancel',

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY_MS: 1000,
    MAX_DELAY_MS: 5000,
  },

  // Timeouts
  TIMEOUT: {
    CHECKOUT_SESSION_MS: 30000, // 30s
    SUBSCRIPTION_CHECK_MS: 5000, // 5s
  },

  // Test card numbers (for development)
  TEST_CARDS: {
    SUCCESS: '4242424242424242',
    DECLINED: '4000000000000002',
    INSUFFICIENT_FUNDS: '4000000000009995',
  },
} as const;

/**
 * Get full checkout redirect URLs
 */
export function getCheckoutUrls(origin: string = window.location.origin) {
  return {
    successUrl: `${origin}${STRIPE_CONFIG.CHECKOUT_SUCCESS_URL}`,
    cancelUrl: `${origin}${STRIPE_CONFIG.CHECKOUT_CANCEL_URL}`,
  };
}

/**
 * Check if running in test mode
 */
export function isTestMode(): boolean {
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('gitpod') ||
         window.location.hostname.includes('preview');
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export default STRIPE_CONFIG;
