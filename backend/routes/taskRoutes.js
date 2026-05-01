import express from "express";
import {
  createTask,
  getTasks,
  acceptTask,
  getMyTasks,
  getAssignedTasks,
  startTask,
  completeTaskByCustomer,
  cancelTask,
  taskerDashboard,
  customerDashboard,
} from "../controllers/taskController.js";

import protect from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =========================
   CUSTOMER ROUTES
========================= */

// Customer creates a task
router.post("/", protect, authorizeRoles("customer"), createTask);

// Customer views dashboard
router.get("/dashboard/customer", protect, authorizeRoles("customer"), customerDashboard);
// Customer views their own tasks
router.get("/my", protect, authorizeRoles("customer"), getMyTasks);

// Customer cancels a task (only if open)
router.patch("/:id/cancel", protect, authorizeRoles("customer"), cancelTask);

/* =========================
   TASKER ROUTES
========================= */

// Tasker views all open tasks (with filters)
router.get("/", protect, authorizeRoles("tasker"), getTasks);

// Tasker views dashboard

router.get("/dashboard/tasker", protect, authorizeRoles("tasker"), taskerDashboard);

// Tasker views tasks assigned to them
router.get("/assigned", protect, authorizeRoles("tasker"), getAssignedTasks);

// Tasker accepts a task
router.patch("/:id/accept", protect, authorizeRoles("tasker"), acceptTask);

// Tasker starts task
router.patch("/:id/start", protect, authorizeRoles("tasker"), startTask);

// Customer completes task + review
router.patch("/:id/complete",protect,authorizeRoles("customer"),completeTaskByCustomer);

export default router;
