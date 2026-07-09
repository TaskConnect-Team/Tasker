import Task from "../models/Task.js";

export const validateTaskPayment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to pay for this task" });
    }

    if (task.status !== "completed") {
      return res.status(400).json({ message: "Task must be completed before payment" });
    }

    if (task.paymentStatus === "paid") {
      return res.status(400).json({ message: "Task already paid" });
    }

    req.task = task;

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};