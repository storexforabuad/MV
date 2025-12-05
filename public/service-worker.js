self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.notification?.body || data.text,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.data?.orderId || 'order-notification',
    requireInteraction: true, // Keeps notification visible until clicked
    data: {
      url: data.data?.url, // Deep link URL
      type: data.data?.type,
      orderId: data.data?.orderId,
      storeId: data.data?.storeId
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      data.notification?.title || 'Bizcon Network',
      options
    )
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data.url || '/';
  const fullUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if admin dashboard is already open
      for (const client of windowClients) {
        if (client.url.includes('/admin/')) {
          // Focus existing window and navigate
          return client.focus().then(() => client.navigate(fullUrl));
        }
      }
      // If no admin window open, create new one
      return clients.openWindow(fullUrl);
    })
  );
});