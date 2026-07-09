import Task from "../models/Task.js";

/**
 * @desc    Get customer dashboard stats
 * @route   GET /api/dashboard/customer
 * @access  Customer
 */
export const getCustomerDashboardStats = async (req, res) => {
  try {
    const customerId = req.user._id;

    const [open, active, completed] = await Promise.all([
      Task.countDocuments({ customer: customerId, status: "open" }),
      Task.countDocuments({
        customer: customerId,
        status: { $in: ["assigned", "in-progress"] },
      }),
      Task.countDocuments({ customer: customerId, status: "completed" }),
    ]);

    return res.status(200).json({ open, active, completed });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
