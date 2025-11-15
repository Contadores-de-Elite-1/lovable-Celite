/**
 * Push Notifications System (PWA)
 * For commission updates, new clients, and important alerts
 */

interface PushNotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn('[Push] Notifications not supported');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Push] Permission:', permission);
    return permission;
  } catch (error) {
    console.error('[Push] Permission request failed:', error);
    return 'denied';
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Subscribe with VAPID key (need to generate)
      // For now, just create subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // Replace with your VAPID public key
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8brDAHoMpKqX3mthjoP6dQ=='
        ),
      });

      console.log('[Push] Subscribed:', subscription);

      // Send subscription to backend
      await sendSubscriptionToBackend(subscription);
    }

    return subscription;
  } catch (error) {
    console.error('[Push] Subscribe failed:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Push] Unsubscribed');

      // Remove from backend
      await removeSubscriptionFromBackend(subscription);

      return true;
    }

    return false;
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error);
    return false;
  }
}

/**
 * Show local notification (doesn't require push subscription)
 */
export async function showLocalNotification(config: PushNotificationConfig): Promise<void> {
  if (!isPushSupported()) {
    console.warn('[Push] Notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Push] Permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(config.title, {
      body: config.body,
      icon: config.icon || '/icon-192.png',
      badge: config.badge || '/icon-192.png',
      tag: config.tag,
      data: config.data,
      actions: config.actions,
      vibrate: [200, 100, 200],
      requireInteraction: false,
    });

    console.log('[Push] Local notification shown');
  } catch (error) {
    console.error('[Push] Show notification failed:', error);
  }
}

/**
 * Predefined notification templates
 */
export const NotificationTemplates = {
  commissionPaid: (amount: number) => ({
    title: 'Comissão Paga! 💰',
    body: `Você recebeu R$ ${amount.toFixed(2)} em comissões`,
    tag: 'commission-paid',
    data: { type: 'commission', amount },
    actions: [
      { action: 'view', title: 'Ver Detalhes' },
      { action: 'dismiss', title: 'OK' },
    ],
  }),

  newClient: (clientName: string) => ({
    title: 'Novo Cliente! 🎉',
    body: `${clientName} acaba de se cadastrar na sua rede`,
    tag: 'new-client',
    data: { type: 'client', clientName },
    actions: [
      { action: 'view', title: 'Ver Dashboard' },
      { action: 'dismiss', title: 'OK' },
    ],
  }),

  levelUp: (newLevel: string) => ({
    title: 'Parabéns! 🏆',
    body: `Você alcançou o nível ${newLevel.toUpperCase()}!`,
    tag: 'level-up',
    data: { type: 'achievement', level: newLevel },
    actions: [
      { action: 'view', title: 'Ver Benefícios' },
      { action: 'dismiss', title: 'OK' },
    ],
  }),

  paymentPending: (daysUntil: number) => ({
    title: 'Pagamento Próximo',
    body: `Suas comissões serão pagas em ${daysUntil} dias`,
    tag: 'payment-reminder',
    data: { type: 'reminder', daysUntil },
  }),
};

/**
 * Helper: Convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Send subscription to backend
 */
async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-subscribe`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }

    console.log('[Push] Subscription saved to backend');
  } catch (error) {
    console.error('[Push] Failed to save subscription:', error);
  }
}

/**
 * Remove subscription from backend
 */
async function removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-unsubscribe`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to remove subscription');
    }

    console.log('[Push] Subscription removed from backend');
  } catch (error) {
    console.error('[Push] Failed to remove subscription:', error);
  }
}

export default {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  showLocalNotification,
  NotificationTemplates,
};
