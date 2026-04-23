import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    balance: { type: Number, default: 0 },
    role: { type: String, enum: ["customer", "tasker"], default: "customer" },
    location: String,
    availability: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
