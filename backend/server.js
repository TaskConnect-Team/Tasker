import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import cookieParser from 'cookie-parser';
// import dotenv from "dotenv";
// dotenv.config();

import taskRoutes from "./routes/taskRoutes.js";
import express from "express";
import stripeWebhookRoutes from "./routes/stripeWebhookRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// const mongoose = require("mongoose");
// const cors = require("cors");
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";



const PORT = process.env.PORT || 3000;
const app = express(); // ✅ Must come before app.use()
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";


// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({ origin: frontendUrl, credentials: true }));

app.use(
  "/api/stripe",
  express.raw({ type: "*/*" }),
  stripeWebhookRoutes
);


app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/payments", paymentRoutes);


// MongoDB connection
connectDB();
// const DB_URL = process.env.atlas_URL;

// mongoose.connect(DB_URL)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch(err => console.log("❌ MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => {
  console.log("Server is running on port " + PORT);
  res.send("Hello from Express Server");
});

// Server
app.listen(PORT, () => console.log(`🚀 Server started on http://localhost:${PORT}`));
