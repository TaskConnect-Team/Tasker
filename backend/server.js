import express from "express";
import dotenv from "dotenv";


// const mongoose = require("mongoose");
// const cors = require("cors");
import cors from "cors";
import connectDB from "./config/db.js";



const app = express(); // ✅ Must come before app.use()

// Middleware
app.use(express.json());
app.use(cors());

import authRoutes from "./routes/authRoutes.js";

app.use("/api/auth", authRoutes);


dotenv.config();

// MongoDB connection
connectDB();
// const DB_URL = process.env.atlas_URL;

// mongoose.connect(DB_URL)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch(err => console.log("❌ MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => {
  console.log("Server is running on port 3000");
  res.send("Hello from Express Server");
});

// Server
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server started on http://localhost:${PORT}`));
