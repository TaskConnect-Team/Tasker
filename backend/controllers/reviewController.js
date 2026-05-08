import Review from "../models/Review.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

/**
 * @desc    Create a review for a completed task
 * @route   POST /api/reviews
 * @access  Customer
 */
export const createReview = async (req, res) => {
  try {
    const { taskId, rating, comment, tags } = req.body;
    const normalizedRating = Number(rating);

    if (!taskId) {
      return res.status(400).json({ message: "Task is required" });
    }

    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (task.status !== "completed") {
      return res.status(400).json({ message: "Task must be completed to review" });
    }

    if (!task.tasker) {
      return res.status(400).json({ message: "Task has no tasker assigned" });
    }

    const existingReview = await Review.findOne({ task: task._id });
    if (existingReview) {
      return res.status(409).json({ message: "Review already submitted" });
    }

    const review = await Review.create({
      task: task._id,
      customer: req.user._id,
      tasker: task.tasker,
      rating: normalizedRating,
      comment: typeof comment === "string" ? comment.trim() : "",
      tags: Array.isArray(tags)
        ? tags.map((tag) => String(tag).trim()).filter(Boolean)
        : [],
    });

    task.status = "reviewed";
    task.rating = normalizedRating;
    task.review = review.comment;
    await task.save();

    const aggregate = await Review.aggregate([
      { $match: { tasker: task.tasker } },
      {
        $group: {
          _id: "$tasker",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const ratingStats = aggregate[0] || { averageRating: 0, totalReviews: 0 };

    await User.findByIdAndUpdate(task.tasker, {
      averageRating: Number(ratingStats.averageRating.toFixed(2)),
      totalReviews: ratingStats.totalReviews,
    });

    return res.status(201).json({ message: "Review submitted", review });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
