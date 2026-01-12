import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  urgency: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  location: String,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  taskerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["open", "in-progress", "completed"], default: "open" },
}, { timestamps: true });

const Task = mongoose.model("Task", taskSchema);
export default Task;  // ✅ Must be default export
