import Task from "../models/Task.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import {
  notifyMatchingTaskersForTask,
  notifyTaskCustomer,
  notifyTasker,
} from "../utils/notificationService.js";
import { buildPointFromCoordinates } from "../utils/geo.js";
import { normalizeList } from "../utils/normalize.js";

const queueNotification = (notificationPromise) => {
  Promise.resolve(notificationPromise).catch((error) => {
    console.error("Push notification failed:", error);
  });
};

const getLocationLabel = (task) => {
  if (typeof task.locationLabel === "string" && task.locationLabel.trim()) {
    return task.locationLabel.trim();
  }

  if (typeof task.location === "string" && task.location.trim()) {
    return task.location.trim();
  }

  return task.city || "";
};

const serializeTask = (task) => {
  const plainTask = typeof task.toObject === "function" ? task.toObject() : task;
  const geoLocation = plainTask.location?.type === "Point" ? plainTask.location : null;
  const locationLabel = getLocationLabel(plainTask);

  return {
    ...plainTask,
    locationLabel,
    location: locationLabel,
    geoLocation,
  };
};

const serializeTasks = (tasks) => tasks.map((task) => serializeTask(task));

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const COMPLETED_PAYMENT_STATUSES = ["completed", "reviewed", "paid"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


const serializeMatchingTask = (task) => ({
  ...serializeTask(task),
  distanceKm:
    typeof task.distance === "number" ? Number((task.distance / 1000).toFixed(2)) : null,
});

const getRangeConfig = (range) => {
  const now = new Date();

  if (range === "weekly") {
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 7 * 7);

    return {
      startDate,
      groupId: {
        year: { $year: "$createdAt" },
        week: { $week: "$createdAt" },
      },
      sort: { "_id.year": 1, "_id.week": 1 },
      formatName: ({ year, week }) => `Wk ${week}, ${String(year).slice(-2)}`,
    };
  }

  if (range === "yearly") {
    const startDate = new Date(now.getFullYear() - 4, 0, 1);

    return {
      startDate,
      groupId: {
        year: { $year: "$createdAt" },
      },
      sort: { "_id.year": 1 },
      formatName: ({ year }) => String(year),
    };
  }

  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  return {
    startDate,
    groupId: {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
    },
    sort: { "_id.year": 1, "_id.month": 1 },
    formatName: ({ month }) => MONTH_LABELS[month - 1] || "",
  };
};


/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Customer
 */
export const createTask = async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res
        .status(403)
        .json({ message: "Only customers can create tasks" });
    }


    const { title, description, price, city, category, urgency, scheduledAt } = req.body;
    const geoLocation = buildPointFromCoordinates(req.body.lat, req.body.lng);

    if (!geoLocation) {
      return res.status(400).json({ message: "lat and lng are required" });
    }


    const task = await Task.create({
      title,
      description,
      price,
      city,
      location: geoLocation,
      category,
      urgency,
      scheduledAt,
      customer: req.user.id,
    });

    queueNotification(notifyMatchingTaskersForTask(task));

    res.status(201).json(serializeTask(task));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all open tasks (with filters)
 * @route   GET /api/tasks
 * @access  Tasker
 */
export const getTasks = async (req, res) => {
  try {
    const query = { status: "open", city: req.user.city }; // ✅ cleaner
    // Price filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Location filter
    if (req.query.location) {
      query.locationLabel = new RegExp(escapeRegex(req.query.location), "i");
    }

    // Urgency filter
    if (req.query.urgency) {
      query.urgency = req.query.urgency;
    }

    const tasks = await Task.find(query)
      .populate("customer", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(serializeTasks(tasks));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Search tasks for taskers
 * @route   GET /api/tasks/search
 * @access  Tasker
 */
export const searchTasks = async (req, res) => {
  try {
    const { q, status, location, minPrice, maxPrice, category } = req.query;
    const query = {};

    const terms = [q, category].filter(Boolean).join(" ").trim();
    if (terms) {
      const regex = new RegExp(escapeRegex(terms), "i");
      query.$or = [{ title: regex }, { description: regex }];
    }

    query.status = status || "open";

    if (location) {
      query.locationLabel = new RegExp(escapeRegex(location), "i");
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const tasks = await Task.find(query)
      .populate("customer", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(serializeTasks(tasks));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get nearby tasks that match a tasker's skill set
 * @route   GET /api/tasks/matching-nearby
 * @access  Tasker
 */
export const getMatchingNearbyTasks = async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const radius = Number(req.query.radius ?? 10);
    const taskerSkills = normalizeList(req.query.taskerSkill);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: "latitude and longitude are required" });
    }

    if (!Number.isFinite(radius) || radius <= 0) {
      return res.status(400).json({ message: "radius must be a positive number" });
    }

    if (!taskerSkills.length) {
      return res.status(400).json({ message: "taskerSkill is required" });
    }

    const tasks = await Task.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distance",
          spherical: true,
          maxDistance: radius * 1000,
          query: {
            status: { $in: ["Pending", "open"] },
            category: { $in: taskerSkills },
          },
        },
      },
      {
        $sort: { distance: 1 },
      },
    ]);

    return res.status(200).json({
      tasks: tasks.map((task) => serializeMatchingTask(task)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get task details
 * @route   GET /api/tasks/:id
 * @access  Authenticated
 */
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("customer", "name city");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json(serializeTask(task));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Accept a task
 * @route   PUT /api/tasks/:id/accept
 * @access  Tasker
 */
export const acceptTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.status !== "open")
      return res.status(400).json({ message: "Task already assigned" });

    // ✅ req.user must exist
    task.tasker = req.user._id;
    task.status = "assigned";

    await task.save();

    queueNotification(
      notifyTaskCustomer(
        task,
        "Task accepted",
        `${req.user.name || "A tasker"} accepted your task.`,
        "task.accepted",
        { taskerId: req.user._id.toString() },
      ),
    );

    res.json({ message: "Task accepted successfully", task: serializeTask(task) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update task status (tasker flow)
 * @route   PATCH /api/tasks/:id/status
 * @access  Tasker
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const nextStatus = String(status || '').trim();

    const allowedStatuses = ['assigned', 'in-progress', 'completed'];
    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid status update' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const taskerId = req.user._id.toString();
    const currentTaskerId = task.tasker ? task.tasker.toString() : null;

    if (nextStatus === 'assigned') {
      if (task.status !== 'open') {
        return res.status(400).json({ message: 'Task is not open' });
      }

      if (currentTaskerId && currentTaskerId !== taskerId) {
        return res.status(403).json({ message: 'Task assigned to another tasker' });
      }

      task.tasker = req.user._id;
      task.status = 'assigned';
    }

    if (nextStatus === 'in-progress') {
      if (task.status !== 'assigned') {
        return res.status(400).json({ message: 'Task is not assigned' });
      }

      if (currentTaskerId !== taskerId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      task.status = 'in-progress';
    }

    if (nextStatus === 'completed') {
      if (task.status !== 'in-progress') {
        return res.status(400).json({ message: 'Task is not in progress' });
      }

      if (currentTaskerId !== taskerId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      task.status = 'completed';
    }

    await task.save();

    if (nextStatus === 'assigned') {
      queueNotification(
        notifyTaskCustomer(
          task,
          "Task accepted",
          `${req.user.name || "A tasker"} accepted your task.`,
          "task.accepted",
          { taskerId: req.user._id.toString() },
        ),
      );
    }

    if (nextStatus === 'in-progress') {
      queueNotification(
        notifyTaskCustomer(
          task,
          "Task started",
          `${req.user.name || "Your tasker"} started working on your task.`,
          "task.started",
          { taskerId: req.user._id.toString() },
        ),
      );
    }

    if (nextStatus === 'completed') {
      queueNotification(
        notifyTaskCustomer(
          task,
          "Task marked complete",
          `${req.user.name || "Your tasker"} marked your task as complete.`,
          "task.completed_by_tasker",
          { taskerId: req.user._id.toString() },
        ),
      );
    }

    return res.status(200).json({ message: 'Task updated', task: serializeTask(task) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get tasks created by logged-in customer
 * @route   GET /api/tasks/my
 * @access  Customer
 */
export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ customer: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json(serializeTasks(tasks));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/**
 * @desc    Get tasks assigned to logged-in tasker
 * @route   GET /api/tasks/assigned
 * @access  Tasker
 */
export const getAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      tasker: req.user._id,
      status: "assigned",
    }).sort({ createdAt: -1 });

    res.status(200).json(serializeTasks(tasks));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get tasks assigned to logged-in tasker (all statuses)
 * @route   GET /api/tasks/tasker
 * @access  Tasker
 */
export const getTaskerTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ tasker: req.user._id })
      .populate("customer", "name")
      .sort({ updatedAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Cancel a task
 * @route   PATCH /api/tasks/:id/cancel
 * @access  Customer
 */
export const cancelTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (task.status !== "open")
      return res.status(400).json({ message: "Task cannot be cancelled" });

    task.status = "cancelled";
    await task.save();

    queueNotification(
      notifyTasker(
        task,
        "Task cancelled",
        `"${task.title}" was cancelled by the customer.`,
        "task.cancelled",
      ),
    );

    res.json({ message: "Task cancelled successfully", task: serializeTask(task) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Tasker starts a task
 * @route   PATCH /api/tasks/:id/start
 * @access  Tasker
 */
export const startTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.tasker)
      return res.status(400).json({ message: "Task not yet accepted" });

    if (task.tasker.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (task.status !== "assigned")
      return res.status(400).json({ message: "Task cannot be started" });

    task.status = "in-progress";
    await task.save();

    queueNotification(
      notifyTaskCustomer(
        task,
        "Task started",
        `${req.user.name || "Your tasker"} started working on your task.`,
        "task.started",
        { taskerId: req.user._id.toString() },
      ),
    );

    res.json({ message: "Task started successfully", task: serializeTask(task) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeTaskByCustomer = async (req, res) => {
  try {
    const { rating, review } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    // Only customer who created task
    if (task.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    // Must be in progress
    if (task.status !== "in-progress")
      return res
        .status(400)
        .json({ message: "Task must be in progress to complete" });

    task.status = "completed";
    task.rating = rating;
    task.review = review;

    await task.save();

    queueNotification(
      notifyTasker(
        task,
        "Task completed",
        `"${task.title}" was confirmed complete by the customer.`,
        "task.completed_by_customer",
        { customerId: req.user._id.toString() },
      ),
    );

    res.json({
      message: "Task completed and reviewed successfully",
      task: serializeTask(task),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// tasker dashboard
export const taskerDashboard = async (req, res) => {
  try {
    const taskerId = req.user._id;

    const open = await Task.countDocuments({
      tasker: taskerId,
      status: "open",
    });

    const totalAssigned = await Task.countDocuments({
      tasker: taskerId,
      status: "assigned",
    });

    const inProgress = await Task.countDocuments({
      tasker: taskerId,
      status: "in-progress",
    });

    const completed = await Task.countDocuments({
      tasker: taskerId,
      status: "completed",
    });
    const cancelled = await Task.countDocuments({
      tasker: taskerId,
      status: "cancelled",
    });

    const sum = await Task.aggregate([
      { $match: { tasker: taskerId, isPaid: true } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);

    res.json({
      open,
      assigned: totalAssigned,
      inProgress,
      completed,
      totalEarned: sum.length > 0 ? sum[0].total : 0,
      cancelled,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get tasker earnings dashboard data
 * @route   GET /api/tasks/earnings?range=weekly|monthly|yearly
 * @access  Tasker
 */
export const getTaskerEarnings = async (req, res) => {
  try {
    const taskerId = new mongoose.Types.ObjectId(req.user.id);
    const requestedRange = String(req.query.range || "monthly").toLowerCase();
    const range = ["weekly", "monthly", "yearly"].includes(requestedRange)
      ? requestedRange
      : "monthly";
    const rangeConfig = getRangeConfig(range);

    const baseMatch = {
      tasker: taskerId,
      status: { $in: COMPLETED_PAYMENT_STATUSES },
    };

    const [user, lifetimeMetrics, history, recentPayouts] = await Promise.all([
      User.findById(taskerId).select("balance"),
      Task.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: { $ifNull: ["$taskerEarning", 0] } },
            totalPlatformFees: { $sum: { $ifNull: ["$platformFee", 0] } },
            completedTasksCount: { $sum: 1 },
          },
        },
      ]),
      Task.aggregate([
        {
          $match: {
            ...baseMatch,
            createdAt: { $gte: rangeConfig.startDate },
          },
        },
        {
          $group: {
            _id: rangeConfig.groupId,
            earnings: { $sum: { $ifNull: ["$taskerEarning", 0] } },
            platformFees: { $sum: { $ifNull: ["$platformFee", 0] } },
            tasks: { $sum: 1 },
          },
        },
        { $sort: rangeConfig.sort },
      ]),
      Task.find(baseMatch)
        .select("title finalPrice price platformFee taskerEarning createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const metrics = lifetimeMetrics[0] || {};
    const chartData = history.map((item) => ({
      name: rangeConfig.formatName(item._id),
      Earnings: item.earnings || 0,
      platformFees: item.platformFees || 0,
      completedTasks: item.tasks || 0,
    }));

    return res.status(200).json({
      success: true,
      walletBalance: user.balance || 0,
      totalEarnings: metrics.totalEarnings || 0,
      completedTasks: metrics.completedTasksCount || 0,
      platformFeesPaid: metrics.totalPlatformFees || 0,
      chartData,
      recentPayouts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// customer dashboard
export const customerDashboard = async (req, res) => {
  try {
    const customerId = req.user._id;

    const open = await Task.countDocuments({
      customer: customerId,
      status: "open",
    });

    const assigned = await Task.countDocuments({
      customer: customerId,
      status: "assigned",
    });

    const inProgress = await Task.countDocuments({
      customer: customerId,
      status: "in-progress",
    });

    const completed = await Task.countDocuments({
      customer: customerId,
      status: "completed",
    });

    const cancelled = await Task.countDocuments({
      customer: customerId,
      status: "cancelled",
    });
    const sum = await Task.aggregate([
      { $match: { customer: customerId, isPaid: true } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);
    res.json({
      open,
      assigned,
      inProgress,
      completed,
      cancelled,
      totalSpent: sum.length > 0 ? sum[0].total : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Tasker marks a task as completed
 * @route   PATCH /api/tasks/:id/finish
 * @access  Tasker
 */
export const completeTaskByTasker = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.tasker)
      return res.status(400).json({ message: "Task not yet accepted" });

    if (task.tasker.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (task.status !== "in-progress")
      return res.status(400).json({ message: "Task cannot be completed" });

    task.status = "completed";
    await task.save();

    queueNotification(
      notifyTaskCustomer(
        task,
        "Task marked complete",
        `${req.user.name || "Your tasker"} marked your task as complete.`,
        "task.completed_by_tasker",
        { taskerId: req.user._id.toString() },
      ),
    );

    res.json({ message: "Task completed successfully", task: serializeTask(task) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get recommended tasks for tasker
 * @route   GET /api/tasks/recommended
 * @access  Tasker
 */
export const getRecommendedTasks = async (req, res) => {
  try {
    const tasker = await User.findById(req.user._id).select("skills city");

    if (!tasker) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const skills = Array.isArray(tasker.skills)
    ? tasker.skills.map((skill) => String(skill).trim()).filter(Boolean)
    : [];


    if (!skills.length) {
      return res.status(200).json([]);
    }
    const query = {
      status: "open",
      category: { $in: skills },
    };

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    const city = (tasker.city || "").toLowerCase();



    const sorted = tasks.sort((a, b) => {
      const aMatch = (a.city || "").toLowerCase() === city ? 1 : 0;
      const bMatch = (b.city || "").toLowerCase() === city ? 1 : 0;
      return bMatch - aMatch;
    });

    return res.status(200).json(serializeTasks(sorted));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
