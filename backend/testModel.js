import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Task from "./models/Task.js";

dotenv.config();
await connectDB();

// --- Test Function ---
const runTests = async () => {
  try {
    console.log("🧪 Running Database Tests...");

    // 1️⃣ Create a new user
    const user = new User({
      name: "Test User",
      email: "test@example.com",
      password: "123456",
      role: "customer",
      location: "Swabi",
    });
    await user.save();
    console.log("✅ User saved:", user.name);

    // 2️⃣ Create a new task for that user
    const task = new Task({
      title: "Fix my laptop",
      description: "It’s not turning on",
      price: 1500,
      urgency: "high",
      location: "Swabi",
      customerId: user._id,
    });
    await task.save();
    console.log("✅ Task saved:", task.title);

    // 3️⃣ Fetch tasks and populate user info
    const tasks = await Task.find().populate("customerId", "name email");
    console.log("📦 Tasks in DB:", tasks);

    console.log("🎉 All tests passed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
};

runTests();
