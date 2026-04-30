// Grand Line Chronicles — Push notification handlers
// Imported by the generated service worker via importScripts

self.addEventListener('push', function(event) {
  if (!event.data) return;

  var payload;
  try {
    payload = event.data.json();
  } catch(e) {
    payload = { title: 'Grand Line Chronicles', body: event.data.text() };
  }

  var options = {
    body:    payload.body,
    icon:    payload.icon  || '/icons/icon-192.png',
    badge:   payload.badge || '/icons/icon-192.png',
    tag:     payload.tag   || 'glc-notification',
    data:    { url: payload.url || '/tasks' },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/tasks';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
      for (var i = 0; i < clients.length; i++) {
        if ('focus' in clients[i]) {
          clients[i].focus();
          clients[i].navigate(url);
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
