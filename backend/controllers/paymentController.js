import Task from "../models/Task.js";
import User from "../models/User.js";
import Stripe from "stripe";
import { calculateCommission } from "../utils/payment.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/payments/create-intent/:id
export const createPaymentIntent = async (req, res) => {
  try {
    const task = req.task; // from middleware

    // 🔒 Price lock
    if (!task.finalPrice) {
      task.finalPrice = task.price;
      await task.save();
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(task.finalPrice * 100), // cents
      currency: "usd",
      metadata: {
        taskId: task._id.toString(),
        customerId: req.user._id.toString(),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// POST /api/payments/:id
export const makePayment = async (req, res) => {
  try {
    const task = req.task; // from middleware

    const { commission, taskerAmount } = calculateCommission(task.finalPrice);

    task.platformFee = commission;
    task.taskerEarning = taskerAmount;

    const tasker = await User.findById(task.tasker);

    if (!tasker) {
      return res.status(404).json({ message: "Tasker not found" });
    }

    tasker.balance += taskerAmount;
    await tasker.save();

    task.paymentStatus = "paid";

    await task.save();

    res.json({
      message: "Payment successful",
      paidAmount: task.finalPrice,
      platformFee: commission,
      taskerReceived: taskerAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};