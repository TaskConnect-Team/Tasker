import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tasker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    tags: [{ type: String, trim: true }],
    embedding: {
      type: [Number],
      select: false,
    },
    embeddedAt: {
      type: Date,
      default: null,
    },

  },
  { timestamps: true }
);


// Indexes
reviewSchema.index({ task: 1 }, { unique: true });
reviewSchema.index({ tasker: 1, rating: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
