self.addEventListener('push', function(event) {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) {}
  const title = data.title || 'Duyệt Chi';
  const body = data.body || '';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: 'https://vandung0802.github.io/Duyet-Chi/icon-192.png',
      badge: 'https://vandung0802.github.io/Duyet-Chi/icon-192.png',
      data: { url: 'https://vandung0802.github.io/Duyet-Chi/app2.html' }
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('https://vandung0802.github.io/Duyet-Chi/app2.html'));
});
