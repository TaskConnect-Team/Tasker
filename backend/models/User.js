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
        default: "",
        trim: true,
      },
      locationLabel: { type: String, default: "" },
      location: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number], // [longitude, latitude] -> NOTE THE ORDER!
        },
      },
      skills: [{ type: String, trim: true }],
      services: [{ type: String, trim: true }],
      isVerified: { type: Boolean, default: false },
      hourlyRate: { type: Number },
      portfolio: { type: String, trim: true },
      tasksPosted: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
      tasksCancelled: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      trustScore: { type: Number, default: 5.0 },
      balance: { type: Number, default: 0 },
      role: { type: String, enum: ["customer", "tasker"], default: "customer" },
      availability: { type: Boolean, default: true },
      fcmTokens: [{ type: String, trim: true }],
    },
    { timestamps: true },
  );

  userSchema.index({ location: "2dsphere" });

  const User = mongoose.model("User", userSchema);
  export default User;
