import Task from "../models/Task.js";
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


    const { title, description, price, city, location, urgency, scheduledAt } =
    req.body;
  

    const task = await Task.create({
      title,
      description,
      price,
      city,
      location,
      urgency,
      scheduledAt,
      customer: req.user.id,
    });

    res.status(201).json(task);
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
      query.location = req.query.location;
    }

    // Urgency filter
    if (req.query.urgency) {
      query.urgency = req.query.urgency;
    }

    const tasks = await Task.find(query)
      .populate("customer", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
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
      const regex = new RegExp(terms, "i");
      query.$or = [{ title: regex }, { description: regex }];
    }

    query.status = status || "open";

    if (location) {
      query.location = new RegExp(location, "i");
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const tasks = await Task.find(query)
      .populate("customer", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    return res.status(200).json(task);
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

    res.json({ message: "Task accepted successfully", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    res.status(200).json(tasks);
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

    res.json({ message: "Task cancelled successfully", task });
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

    res.json({ message: "Task started successfully", task });
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

    res.json({
      message: "Task completed and reviewed successfully",
      task,
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
