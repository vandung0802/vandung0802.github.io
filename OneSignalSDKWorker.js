importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBUy3IMuyXZYN9dkyhrariRD-aPbC0HmT8",
  authDomain: "duyetchi-pva379.firebaseapp.com",
  databaseURL: "https://duyetchi-pva379-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "duyetchi-pva379",
  storageBucket: "duyetchi-pva379.firebasestorage.app",
  messagingSenderId: "366275914302",
  appId: "1:366275914302:web:c9d7aefd880fa0985c7f6f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const title = payload.notification?.title || 'Duyệt Chi';
  const body = payload.notification?.body || '';
  self.registration.showNotification(title, {
    body: body,
    icon: 'https://vandung0802.github.io/Duyet-Chi/icon-192.png',
    badge: 'https://vandung0802.github.io/Duyet-Chi/icon-192.png',
    data: { url: 'https://vandung0802.github.io/Duyet-Chi/app2.html' }
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('https://vandung0802.github.io/Duyet-Chi/app2.html'));
});
