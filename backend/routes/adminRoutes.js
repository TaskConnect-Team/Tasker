import express from "express";
import { adminLogin, adminLogout, verifyAdmin } from "../controllers/adminAuthController.js";
import { isAdmin } from "../middleware/adminAuthMiddleware.js";
import {
  getKPIs,
  getChartsData,
  getHighRiskTaskers,
  verifyTasker,
  updateTrustScore,
  getUnverifiedTaskers,
  getPayoutPipeline,
  processPayout,
  sendBlastNotification,
  searchUsersAndTasks,
} from "../controllers/adminDashboardController.js";

const router = express.Router();

// ==================== AUTH ENDPOINTS ====================
/**
 * Admin login (no middleware needed - public endpoint)
 * POST /api/admin/login
 */
router.post("/login", adminLogin);

router.get("/", (req, res) => {
    res.send("admin route is working...");
});

/**
 * Admin logout
 * POST /api/admin/logout
 */
router.post("/logout", isAdmin, adminLogout);

/**
 * Verify admin token
 * GET /api/admin/verifyAdmin
 */
router.get("/verifyAdmin", isAdmin, verifyAdmin);
// router.get("/verify", (req, res) => {
//     console.log("admin verify call ....")
//     res.status(200).json({ message: "Admin verify endpoint is working" });
// });



// ==================== PROTECTED ADMIN ROUTES ====================
// All routes below require isAdmin middleware

/**
 * Get KPIs
 * GET /api/admin/kpis
 */
router.get("/kpis", isAdmin, getKPIs);

/**
 * Get charts data (heatmap coordinates & cancellation rate)
 * GET /api/admin/charts-data
 */
router.get("/charts-data", isAdmin, getChartsData);

/**
 * Get high-risk taskers
 * GET /api/admin/high-risk-taskers
 */
router.get("/high-risk-taskers", isAdmin, getHighRiskTaskers);

/**
 * Get unverified taskers
 * GET /api/admin/unverified-taskers
 */
router.get("/unverified-taskers", isAdmin, getUnverifiedTaskers);

/**
 * Get payout pipeline
 * GET /api/admin/payout-pipeline
 */
router.get("/payout-pipeline", isAdmin, getPayoutPipeline);

/**
 * Search users and tasks
 * GET /api/admin/search?q=...
 */
router.get("/search", isAdmin, searchUsersAndTasks);

/**
 * Toggle tasker verification
 * PATCH /api/admin/verify-tasker/:id
 */
router.patch("/verify-tasker/:id", isAdmin, verifyTasker);

/**
 * Update user trust score
 * PATCH /api/admin/trust-score/:id
 * Body: { trustScore: number (0-10) }
 */
router.patch("/trust-score/:id", isAdmin, updateTrustScore);

/**
 * Process payout for tasker
 * POST /api/admin/process-payout/:id
 */
router.post("/process-payout/:id", isAdmin, processPayout);

/**
 * Send blast notification
 * POST /api/admin/send-blast
 * Body: { targetRole: 'customer'|'tasker'|'all', title: string, message: string }
 */
router.post("/send-blast", isAdmin, sendBlastNotification);

export default router;
