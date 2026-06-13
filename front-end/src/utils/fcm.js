import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from "../config/firebaseConfig.js";
import api from "../api/axios.js";

const messaging = getMessaging(app);

const getServiceWorkerRegistration = async () => {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  const existingRegistration = await navigator.serviceWorker.getRegistration("/");
  if (existingRegistration?.active) {
    return existingRegistration;
  }

  // await navigator.serviceWorker.register("/sw.js", { scope: "/" });

  return await navigator.serviceWorker.ready;
};

const getNotificationUrl = (payload = {}) => {
  const data = payload.data || {};

  if (data.url) {
    return data.url;
  }

  if (data.taskId) {
    return `/tasks/${data.taskId}`;
  }

  return "/notifications";
};

const openNotificationUrl = (url) => {
  if (!url || typeof window === "undefined") {
    return;
  }

  window.focus();
  window.location.assign(url);
};

export const requestNotificationPermission = async () => {


  if (typeof window === "undefined" || !("Notification" in window)) {
    throw new Error("Notifications are not supported in this browser");
  }

  const permission = Notification.permission === "default"
    ? await Notification.requestPermission()
    : Notification.permission;

  if (permission !== "granted") {
    return null;
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    throw new Error("Service workers are not supported in this browser");
  }

  // console.log("Current VAPID key, messaging, registration ------ :",import.meta.env.VITE_FIREBASE_VAPID_KEY, messaging, registration);

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });


  if (!token) {
    return null;
  }

  await api.post("/users/update-token", {
    token,
  });

  return token;
};

export const removeCurrentFcmToken = async () => {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    return;
  }

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    await api.post("/users/remove-token", { token });
  }
};

export const onForegroundMessage = (handler) =>
  onMessage(messaging, (payload) => {
    if (typeof handler === "function") {
      handler(payload);
      return;
    }

    const title = payload.notification?.title || "TaskConnect";
    const body = payload.notification?.body || "You have a new notification";

    if (Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/icon-192.png",
        data: payload.data,
      });

      notification.onclick = () => {
        notification.close();
        openNotificationUrl(getNotificationUrl(payload));
      };
    }
  });

export default messaging;
