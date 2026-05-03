import express from "express";
import protect from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getPublicProfile, searchTaskers, updateProfile } from "../controllers/userController.js";

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.get("/search-taskers", protect, authorizeRoles("customer"), searchTaskers);
router.get("/:id", getPublicProfile);

export default router;
