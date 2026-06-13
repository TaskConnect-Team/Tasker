import User from "../models/User.js";
import { sendPushNotification } from "./pushNotification.js";

const DEFAULT_TASK_RADIUS_KM = Number(process.env.TASK_NOTIFICATION_RADIUS_KM || 20);

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getTaskId = (task) => task?._id?.toString?.() || task?.id?.toString?.();

const getTaskUrl = (task) => {
  const taskId = getTaskId(task);
  return taskId ? `/tasks/${taskId}` : "/";
};

const getTaskData = (task, type, extra = {}) => {
  const taskId = getTaskId(task);

  return {
    type,
    taskId,
    url: getTaskUrl(task),
    ...extra,
  };
};

const getUserTokens = (users) =>
  users.flatMap((user) => (Array.isArray(user.fcmTokens) ? user.fcmTokens : []));

const notifyUsers = async ({ users, title, body, data, link }) => {
  const tokens = getUserTokens(users);

  if (!tokens.length) {
    return null;
  }

  return sendPushNotification(tokens, title, body, data, { link });
};

export const notifyMatchingTaskersForTask = async (task) => {
  const categories = normalizeList(task.category);
  const city = typeof task.city === "string" ? task.city.trim() : "";
  const baseMatch = {
    role: "tasker",
    availability: true,
    fcmTokens: { $exists: true, $ne: [] },
  };

  if (categories.length) {
    baseMatch.skills = { $in: categories };
  }

  const coordinates = task.location?.coordinates;
  const hasCoordinates = Array.isArray(coordinates) && coordinates.length === 2;

  let taskers = [];

  if (hasCoordinates) {
    taskers = await User.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates },
          distanceField: "distance",
          spherical: true,
          maxDistance: DEFAULT_TASK_RADIUS_KM * 1000,
          query: baseMatch,
        },
      },
      {
        $project: {
          fcmTokens: 1,
        },
      },
      {
        $limit: 100,
      },
    ]);
  }

  if (!taskers.length && city) {
    taskers = await User.find({
      ...baseMatch,
      city: new RegExp(`^${escapeRegex(city)}$`, "i"),
    })
      .select("fcmTokens")
      .limit(100);
  }

  return notifyUsers({
    users: taskers,
    title: "New matching task",
    body: task.title ? `${task.title} is available near you.` : "A new task is available near you.",
    data: getTaskData(task, "task.created", {
      category: categories.join(","),
      city: task.city || "",
    }),
    link: getTaskUrl(task),
  });
};

export const notifyTaskCustomer = async (task, title, body, type, extra = {}) => {
  const customer = await User.findById(task.customer).select("fcmTokens");

  if (!customer) {
    return null;
  }

  return notifyUsers({
    users: [customer],
    title,
    body,
    data: getTaskData(task, type, extra),
    link: getTaskUrl(task),
  });
};

export const notifyTasker = async (task, title, body, type, extra = {}) => {
  if (!task.tasker) {
    return null;
  }

  const tasker = await User.findById(task.tasker).select("fcmTokens");

  if (!tasker) {
    return null;
  }

  return notifyUsers({
    users: [tasker],
    title,
    body,
    data: getTaskData(task, type, extra),
    link: getTaskUrl(task),
  });
};
