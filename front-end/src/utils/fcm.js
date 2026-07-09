import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "../config/firebase.js";
import api from "../api/axios.js";

const messaging = getMessaging(app);


const getServiceWorkerRegistration = async () => {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    // 1. Fetch the main container control reference from the browser
    const registration = await navigator.serviceWorker.ready;
    
    // 2. Safeguard check: If the registration is valid but the active target is empty, wait
    if (registration && !registration.active) {
      console.log("Service worker is not active yet, waiting...");
      // Wait for a brief window until installation tasks complete
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return registration;
  } catch (error) {
    console.error("Failed to parse ready PWA worker instance:", error);
    return null;
  }
};

// const getServiceWorkerRegistration = async () => {
//   if (!("serviceWorker" in navigator)) {
//     return null;
//   }


//   try {
//     // 1. VitePWA registers the service worker under the path name "/sw.js"
//     const registrations = await navigator.serviceWorker.getRegistrations();
//     const pwaRegistration = registrations.find(reg => 
//       reg.active && reg.active.scriptURL.includes("sw.js")
//     );

//     if (pwaRegistration) {
//       return pwaRegistration;
//     }

//     // 2. Fallback to wait for ready status if found but not active
//     const readyRegistration = await navigator.serviceWorker.ready;
//     if (readyRegistration) {
//       return readyRegistration;
//     }

//     return null;
//   } catch (error) {
//     console.error("Failed to fetch PWA service worker:", error);
//     return null;
//   }
// };

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

  
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  
  console.log("Current VAPID key, messaging, registration ------ :",
  import.meta.env.VITE_FIREBASE_VAPID_KEY, messaging, registration);

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
