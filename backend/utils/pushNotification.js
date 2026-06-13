import { createRequire } from "module";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import User from "../models/User.js";

const require = createRequire(import.meta.url);

const loadServiceAccount = () => {
  const productionServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (productionServiceAccount) {
    return JSON.parse(productionServiceAccount);
  }

  return require("../config/firebase-service-account.json");
};

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(loadServiceAccount()),
    });

const messaging = getMessaging(firebaseApp);

const cleanupDeadTokens = async (deadTokens) => {
  const uniqueDeadTokens = [...new Set(deadTokens.filter(Boolean))];

  if (!uniqueDeadTokens.length) {
    return;
  }

  await User.updateMany(
    { fcmTokens: { $in: uniqueDeadTokens } },
    { $pull: { fcmTokens: { $in: uniqueDeadTokens } } },
  );
};

const normalizeDataPayload = (dataPayload = {}) =>
  Object.fromEntries(
    Object.entries(dataPayload || {})
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );

const isAbsoluteHttpUrl = (value) => /^https?:\/\//i.test(String(value || ""));

export const sendPushNotification = async (
  tokensArray,
  title,
  body,
  dataPayload = {},
  options = {},
) => {
  const tokens = [...new Set((tokensArray || []).filter(Boolean))];

  if (!tokens.length) {
    return {
      successCount: 0,
      failureCount: 0,
      responses: [],
    };
  }

  const data = normalizeDataPayload(dataPayload);
  const link = options.link || data.url;

  const message = {
    tokens,
    notification: {
      title,
      body,
    },
    data,
  };

  if (link) {
    message.webpush = {
      notification: {
        icon: "/icon-192.png",
        data,
      },
    };

    if (isAbsoluteHttpUrl(link)) {
      message.webpush.fcmOptions = {
        link,
      };
    }
  }

  const response = await messaging.sendEachForMulticast(message);

  const deadTokens = response.responses
    .map((item, index) => ({ item, token: tokens[index] }))
    .filter(({ item }) => !item.success)
    .filter(({ item }) => {
      const errorCode = item.error?.code;
      return (
        errorCode === "messaging/invalid-registration-token" ||
        errorCode === "messaging/registration-token-not-registered"
      );
    })
    .map(({ token }) => token);

  await cleanupDeadTokens(deadTokens);

  return response;
};

export default firebaseApp;
