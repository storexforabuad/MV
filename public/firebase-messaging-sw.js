// Firebase Messaging Service Worker for push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyCTMqE5zR_jB6m8gqPpkxUxNpMGCr5ZEwk",
    authDomain: "ladevida-f3b00.firebaseapp.com",
    projectId: "ladevida-f3b00",
    storageBucket: "ladevida-f3b00.firebasestorage.app",
    messagingSenderId: "574982638682",
    appId: "1:574982638682:web:982e1a4b3e7a2a8cdff8c5",
    measurementId: "G-4WKQ2EETLL"
});

const messaging = firebase.messaging();

// Instantly activate service worker
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: payload.data?.orderId || 'notification',
        requireInteraction: true,
        data: payload.data
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks (same as service-worker.js)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';
    const notificationType = event.notification.data?.type;
    const fullUrl = new URL(targetUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {

            // For vendor notifications - check if admin dashboard is open
            if (notificationType === 'new_order') {
                for (const client of windowClients) {
                    if (client.url.includes('/admin/')) {
                        return client.focus().then(() => client.navigate(fullUrl));
                    }
                }
            }

            // For customer notifications - check if storefront is open
            if (notificationType === 'order_status_update') {
                const storeId = event.notification.data?.storeId;
                for (const client of windowClients) {
                    // Check if URL contains storeId but NOT admin
                    if (storeId && client.url.includes(storeId) && !client.url.includes('/admin/')) {
                        return client.focus().then(() => client.navigate(fullUrl));
                    }
                }
            }

            // If no matching window open, create new one
            return clients.openWindow(fullUrl);
        })
    );
});
