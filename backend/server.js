import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import cookieParser from 'cookie-parser';

import taskRoutes from "./routes/taskRoutes.js";
import express from "express";
import stripeWebhookRoutes from "./routes/stripeWebhookRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

import cors from "cors";
import connectDB from "./config/db.js";
// import {createSpatialIndex} from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";



const PORT = process.env.PORT || 3000;
const app = express(); // ✅ Must come before app.use()
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
const allowedOrigins = (allowedOriginsEnv || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

if (!allowedOrigins.length) {
  throw new Error(
    'Missing required ALLOWED_ORIGINS configuration. Set ALLOWED_ORIGINS to a comma-separated list of allowed browser origins.'
  );
}

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

app.use(
  "/api/stripe",
  express.raw({ type: "*/*" }),
  stripeWebhookRoutes
);


app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);


app.get("/", (req, res) => {
  res.send("Hello from Express Server");
});

// Global error-handling middleware
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error",
  });
});

// Graceful shutdown on unhandled errors
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

// Connect to DB then start server
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`Server started on http://localhost:${PORT}`));
});
