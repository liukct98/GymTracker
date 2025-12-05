// Service Worker for background notifications
const CACHE_NAME = 'gym-tracker-v1';

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(clients.claim());
});

// Handle messages from main app
self.addEventListener('message', (event) => {
    if (event.data.type === 'SET_TIMER') {
        const { endTime, title, body } = event.data;
        const now = Date.now();
        const delay = endTime - now;
        
        if (delay > 0) {
            setTimeout(() => {
                self.registration.showNotification(title, {
                    body: body,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: 'rest-timer',
                    requireInteraction: true,
                    vibrate: [200, 100, 200],
                    actions: [
                        { action: 'open', title: 'Apri App' }
                    ]
                });
                
                // Play sound notification
                self.registration.getNotifications({ tag: 'rest-timer' }).then(notifications => {
                    // Vibrate if supported
                    if ('vibrate' in navigator) {
                        navigator.vibrate([200, 100, 200, 100, 200]);
                    }
                });
            }, delay);
        }
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Focus existing window if available
                    for (let client of clientList) {
                        if ('focus' in client) {
                            return client.focus();
                        }
                    }
                    // Open new window if no existing window
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});
