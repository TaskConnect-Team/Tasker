import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
    },

    urgency: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },

    status: {
      type: String,
      enum: [
        "open",
        "assigned",
        "in-progress",
        "completed",
        "cancelled",
        "paid",
      ],
      default: "open",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    finalPrice: Number,

    paymentIntentId: String,
    paymentStatus: {
      type: String,
      enum: ["none", "pending", "paid", "failed"],
      default: "none",
    },
    platformFee: Number,
    taskerEarning: Number,
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tasker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    scheduledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
