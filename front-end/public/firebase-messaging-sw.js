/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCEMSnhL_b_K1KfbDArFoV-Gcg3kZyYP1w",
  authDomain: "taskconnect-web.firebaseapp.com",
  projectId: "taskconnect-web",
  storageBucket: "taskconnect-web.appspot.com",
  messagingSenderId: "305816675590",
  appId: "1:305816675590:web:f2cf54b2f280469a7e2a87",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "TaskConnect";
  const data = payload.data || {};
  const options = {
    body: payload.notification?.body || "You have a new notification",
    icon: "/icon-192.png",
    data: {
      ...data,
      url: data.url || (data.taskId ? `/tasks/${data.taskId}` : "/notifications"),
    },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/notifications";
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const existingClient = clientList.find((client) => client.url === absoluteUrl);

      if (existingClient) {
        return existingClient.focus();
      }

      return clients.openWindow(absoluteUrl);
    }),
  );
});
