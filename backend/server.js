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
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const normalizeOrigin = (origin) => origin.replace(/\/+$/, '');


// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  })
);

console.log('✅ CORS allowed origins:', allowedOrigins);

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
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server started on http://localhost:${PORT}`));
