import Stripe from "stripe";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { calculateCommission } from "../utils/payment.js";

export const stripeWebhook = async (req, res) => {
  // ✅ Initialize Stripe HERE (after dotenv is loaded)
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("❌ Webhook signature verification failed.");
    return res.status(400).send(`Webhook Error: ${err.message}`);
}
  // ✅ Payment success logic (UNCHANGED)
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { taskId } = paymentIntent.metadata;

    const task = await Task.findById(taskId);

    if (!task || task.paymentStatus === "paid") {
      return res.json({ received: true });
    }

    // 🔒 Price locking
    if (!task.finalPrice) {
      task.finalPrice = task.price;
    }

    const { commission, taskerAmount } = calculateCommission(task.finalPrice);

    task.platformFee = commission;
    task.taskerEarning = taskerAmount;

    const tasker = await User.findById(task.tasker);

    if (!tasker) return res.json({ received: true });

    tasker.balance += taskerAmount;

    await tasker.save();

    task.paymentStatus = "paid";

    await task.save();
  }

  res.json({ received: true });
};