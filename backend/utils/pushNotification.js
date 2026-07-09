// backend/utils/pushNotification.js
import { getMessaging } from "firebase-admin/messaging";
import { firebaseAdminApp } from "../config/adminFirebase.js"; // 🔥 Direct import of the clean instance
import User from "../models/User.js";

// Hook messaging directly into the already active app instance
const messaging = getMessaging(firebaseAdminApp);

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

export default firebaseAdminApp;
