/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

// These values are injected at deploy-time by the CI/CD pipeline.
// They match the VITE_FIREBASE_* env vars used by the main app.
// TODO: replace with a build step that generates this file from env vars.
firebase.initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "taskconnect-web",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID ,
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
