self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.text,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      productId: data.productId // Store productId for click handler
    }
  };

  event.waitUntil(
    self.registration.showNotification('Bizcon Network', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Get the productId from notification data
  const productId = event.notification.data.productId;
  
  // Create the product URL
  const productUrl = new URL(`/products/${productId}`, self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there's already a window with the product page open
      for (const client of windowClients) {
        if (client.url === productUrl) {
          return client.focus();
        }
      }
      // If no existing window, open a new one
      return clients.openWindow(productUrl);
    })
  );
});