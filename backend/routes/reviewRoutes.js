import express from "express";
import protect from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { createReview } from "../controllers/reviewController.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("customer"), createReview);

export default router;
