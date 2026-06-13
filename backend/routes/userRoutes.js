import express from "express";
import protect from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getNearbyTaskers, getPublicProfile, removeFcmToken, saveFcmToken, searchTaskers, updateProfile } from "../controllers/userController.js";

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.post("/update-token", protect, saveFcmToken);
router.post("/remove-token", protect, removeFcmToken);
router.get("/search-taskers", protect, authorizeRoles("customer"), searchTaskers);
router.get("/nearby-taskers", protect, authorizeRoles("customer", "tasker"), getNearbyTaskers);
router.get("/:id", getPublicProfile);

export default router;
