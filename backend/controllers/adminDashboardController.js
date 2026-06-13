import User from "../models/User.js";
import Task from "../models/Task.js";
import admin from "firebase-admin";

/**
 * GET /api/admin/kpis
 * Fetch key performance indicators
 * Returns: platformRevenue, escrowTracker, urgentTaskRatio, activeTaskerSupply
 */
export const getKPIs = async (req, res) => {
  try {
    const [
      platformRevenueData,
      escrowData,
      urgentTasksData,
      totalTasksData,
      activeTaskersData,
    ] = await Promise.all([
      // Platform Revenue: Sum of platformFee from paid tasks
      Task.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, totalRevenue: { $sum: "$platformFee" } } },
      ]),

      // Escrow Tracker: Sum of price from pending payment tasks
      Task.aggregate([
        { $match: { paymentStatus: "pending" } },
        { $group: { _id: null, escrowAmount: { $sum: "$price" } } },
      ]),

      // Urgent Tasks Count
      Task.aggregate([
        { $match: { urgency: "urgent" } },
        { $count: "urgentCount" },
      ]),

      // Total Tasks Count
      Task.aggregate([{ $count: "totalCount" }]),

      // Active Taskers (Available for work)
      User.countDocuments({ role: "tasker", availability: true }),
    ]);

    const platformRevenue = platformRevenueData[0]?.totalRevenue || 0;
    const escrowTracker = escrowData[0]?.escrowAmount || 0;
    const urgentTaskCount = urgentTasksData[0]?.urgentCount || 0;
    const totalTasks = totalTasksData[0]?.totalCount || 0;
    const urgentTaskRatio = totalTasks > 0 ? ((urgentTaskCount / totalTasks) * 100).toFixed(2) : 0;
    const activeTaskerSupply = activeTaskersData;

    res.status(200).json({
      platformRevenue,
      escrowTracker,
      urgentTaskRatio: parseFloat(urgentTaskRatio),
      activeTaskerSupply,
    });
  } catch (error) {
    console.error("KPI fetch error:", error);
    res.status(500).json({ message: "Error fetching KPIs", error: error.message });
  }
};

/**
 * GET /api/admin/charts-data
 * Fetch data for visualizations (heatmap coordinates and cancellation rate)
 */
export const getChartsData = async (req, res) => {
  try {
    const [heatmapData, cancellationData] = await Promise.all([
      // Heatmap: Get all task coordinates
      Task.find(
        { "location.coordinates": { $exists: true } },
        { "location.coordinates": 1, _id: 0 }
      ).lean(),

      // Cancellation Rate: Group tasks by date and count cancellations
      Task.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            totalTasks: { $sum: 1 },
            cancelledTasks: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: "$_id",
            totalTasks: 1,
            cancelledTasks: 1,
            cancellationRate: {
              $cond: [
                { $eq: ["$totalTasks", 0] },
                0,
                {
                  $multiply: [
                    { $divide: ["$cancelledTasks", "$totalTasks"] },
                    100,
                  ],
                },
              ],
            },
            _id: 0,
          },
        },
      ]),
    ]);

    // Transform heatmap data: Extract coordinates from nested location object
    const heatmapCoordinates = heatmapData.map((task) => {
      const [longitude, latitude] = task.location.coordinates;
      return { lat: latitude, lng: longitude };
    });

    res.status(200).json({
      heatmapCoordinates,
      cancellationData,
    });
  } catch (error) {
    console.error("Charts data fetch error:", error);
    res.status(500).json({ message: "Error fetching charts data", error: error.message });
  }
};

/**
 * GET /api/admin/high-risk-taskers
 * Returns taskers with averageRating < 3.0 (potential trust concerns)
 */
export const getHighRiskTaskers = async (req, res) => {
  try {
    const highRiskTaskers = await User.find(
      {
        role: "tasker",
        averageRating: { $lt: 3.0 },
      },
      {
        _id: 1,
        name: 1,
        email: 1,
        averageRating: 1,
        totalReviews: 1,
        trustScore: 1,
        isVerified: 1,
      }
    ).sort({ averageRating: 1 });

    res.status(200).json({
      count: highRiskTaskers.length,
      taskers: highRiskTaskers,
    });
  } catch (error) {
    console.error("High-risk taskers fetch error:", error);
    res.status(500).json({ message: "Error fetching high-risk taskers", error: error.message });
  }
};

/**
 * PATCH /api/admin/verify-tasker/:id
 * Toggle tasker verification status
 */
export const verifyTasker = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Tasker not found" });
    }

    if (user.role !== "tasker") {
      return res.status(400).json({ message: "User is not a tasker" });
    }

    // Toggle verification
    user.isVerified = !user.isVerified;
    await user.save();

    res.status(200).json({
      message: `Tasker ${user.isVerified ? "verified" : "unverified"} successfully`,
      tasker: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Verify tasker error:", error);
    res.status(500).json({ message: "Error verifying tasker", error: error.message });
  }
};

/**
 * PATCH /api/admin/trust-score/:id
 * Manually update a user's trust score
 */
export const updateTrustScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { trustScore } = req.body;

    // Validate trust score
    if (typeof trustScore !== "number" || trustScore < 0 || trustScore > 10) {
      return res.status(400).json({ message: "Trust score must be between 0 and 10" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { trustScore },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Trust score updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        trustScore: user.trustScore,
      },
    });
  } catch (error) {
    console.error("Update trust score error:", error);
    res.status(500).json({ message: "Error updating trust score", error: error.message });
  }
};

/**
 * GET /api/admin/unverified-taskers
 * Fetch all unverified taskers
 */
export const getUnverifiedTaskers = async (req, res) => {
  try {
    const unverifiedTaskers = await User.find(
      {
        role: "tasker",
        isVerified: false,
      },
      {
        _id: 1,
        name: 1,
        email: 1,
        averageRating: 1,
        totalReviews: 1,
        trustScore: 1,
        skills: 1,
        createdAt: 1,
      }
    ).sort({ createdAt: -1 });

    res.status(200).json({
      count: unverifiedTaskers.length,
      taskers: unverifiedTaskers,
    });
  } catch (error) {
    console.error("Unverified taskers fetch error:", error);
    res.status(500).json({ message: "Error fetching unverified taskers", error: error.message });
  }
};

/**
 * GET /api/admin/payout-pipeline
 * Fetch taskers with balance > 0 (ready for payout)
 */
export const getPayoutPipeline = async (req, res) => {
  try {
    const payoutPipeline = await User.find(
      {
        role: "tasker",
        balance: { $gt: 0 },
      },
      {
        _id: 1,
        name: 1,
        email: 1,
        balance: 1,
        averageRating: 1,
        isVerified: 1,
      }
    ).sort({ balance: -1 });

    const totalBalance = payoutPipeline.reduce((sum, user) => sum + user.balance, 0);

    res.status(200).json({
      count: payoutPipeline.length,
      totalBalance,
      taskers: payoutPipeline,
    });
  } catch (error) {
    console.error("Payout pipeline fetch error:", error);
    res.status(500).json({ message: "Error fetching payout pipeline", error: error.message });
  }
};

/**
 * POST /api/admin/process-payout/:id
 * Process payout for a tasker (reset balance to 0)
 */
export const processPayout = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Tasker not found" });
    }

    if (user.role !== "tasker") {
      return res.status(400).json({ message: "User is not a tasker" });
    }

    const previousBalance = user.balance;
    user.balance = 0;
    await user.save();

    res.status(200).json({
      message: "Payout processed successfully",
      payout: {
        taskerId: user._id,
        taskerName: user.name,
        taskerEmail: user.email,
        amountPaid: previousBalance,
        newBalance: 0,
      },
    });
  } catch (error) {
    console.error("Process payout error:", error);
    res.status(500).json({ message: "Error processing payout", error: error.message });
  }
};

/**
 * POST /api/admin/send-blast
 * Send FCM push notification to users by role
 * Body: { targetRole: 'customer'|'tasker'|'all', title: string, message: string }
 */
export const sendBlastNotification = async (req, res) => {
  try {
    const { targetRole, title, message } = req.body;

    // Validate input
    if (!targetRole || !title || !message) {
      return res.status(400).json({
        message: "targetRole, title, and message are required",
      });
    }

    if (!["customer", "tasker", "all"].includes(targetRole)) {
      return res.status(400).json({
        message: "targetRole must be 'customer', 'tasker', or 'all'",
      });
    }

    // Query users based on target role
    let query = { fcmTokens: { $exists: true, $ne: [] } };
    if (targetRole !== "all") {
      query.role = targetRole;
    }

    const users = await User.find(query, { fcmTokens: 1, name: 1, email: 1 });

    // Extract all FCM tokens
    const tokens = [];
    users.forEach((user) => {
      if (Array.isArray(user.fcmTokens)) {
        tokens.push(...user.fcmTokens);
      }
    });

    if (tokens.length === 0) {
      return res.status(400).json({
        message: `No FCM tokens found for target role: ${targetRole}`,
      });
    }

    // Prepare notification payload
    const notification = {
      title,
      body: message,
    };

    const data = {
      type: "admin_blast",
      timestamp: new Date().toISOString(),
    };

    // Send multicast notification via Firebase Admin
    const messageBody = {
      notification,
      data,
      webpush: {
        notification: {
          title,
          body: message,
          icon: "/firebase-logo.png",
        },
      },
    };

    const response = await admin.messaging().sendMulticast({
      ...messageBody,
      tokens: tokens.slice(0, 500), // Firebase allows max 500 tokens per request
    });

    console.log(
      `✅ Blast notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`
    );

    res.status(200).json({
      message: "Blast notification sent successfully",
      details: {
        targetRole,
        recipientCount: users.length,
        tokenCount: tokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
      },
    });
  } catch (error) {
    console.error("Send blast notification error:", error);
    res.status(500).json({ message: "Error sending notification", error: error.message });
  }
};

/**
 * GET /api/admin/search
 * Search users by email/name and tasks by ID
 * Query params: q (search query)
 */
export const searchUsersAndTasks = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const searchQuery = q.trim();
    const regex = new RegExp(searchQuery, "i");

    const [users, tasks] = await Promise.all([
      // Search users by email or name
      User.find(
        {
          $or: [{ email: regex }, { name: regex }],
        },
        {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          averageRating: 1,
          isVerified: 1,
          createdAt: 1,
        }
      ).limit(10),

      // Search tasks by ID
      Task.find(
        {
          $or: [
            { _id: { $in: [searchQuery] } },
            { title: regex },
          ],
        },
        {
          _id: 1,
          title: 1,
          price: 1,
          status: 1,
          urgency: 1,
          createdAt: 1,
        }
      ).limit(10),
    ]);

    res.status(200).json({
      users,
      tasks,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Error searching", error: error.message });
  }
};

export default {
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
};
