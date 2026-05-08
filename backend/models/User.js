import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: "" },
    tagline: { type: String, default: "" },
    bio: { type: String, default: "" },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    location: { type: String, default: "" },
    skills: [{ type: String, trim: true }],
    services: [{ type: String, trim: true }],
    isVerified: { type: Boolean, default: false },
    hourlyRate: { type: Number },
    portfolio: [{ type: String, trim: true }],
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    trustScore: { type: Number, default: 5.0 },
    balance: { type: Number, default: 0 },
    role: { type: String, enum: ["customer", "tasker"], default: "customer" },
    availability: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
