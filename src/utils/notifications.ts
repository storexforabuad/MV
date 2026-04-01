

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker is not supported in this browser');
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied');
  }

  return permission;
}

export async function subscribeToPushNotifications(
  swRegistration: ServiceWorkerRegistration
): Promise<PushSubscriptionJSON> {
  try {
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    });

    const jsonSubscription = subscription.toJSON();
    
    // Add type checks
    if (!subscription.endpoint || !jsonSubscription.keys?.p256dh || !jsonSubscription.keys?.auth) {
      throw new Error('Invalid push subscription');
    }

    // Explicitly type the return value with null checks
    const subscriptionJSON: PushSubscriptionJSON = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime || null,
      keys: {
        p256dh: jsonSubscription.keys.p256dh,
        auth: jsonSubscription.keys.auth
      }
    };

    return subscriptionJSON;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to subscribe to push notifications:', error.message);
    }
    throw error;
  }
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function unsubscribeFromPushNotifications(
  swRegistration: ServiceWorkerRegistration
): Promise<void> {
  const subscription = await swRegistration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
}
