import express from "express";
import protect from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validateTaskPayment } from "../middleware/validateTaskPayment.js";
import { makePayment, createPaymentIntent } from "../controllers/paymentController.js";

const router = express.Router();

router.post(
  "/create-intent/:id",
  protect,
  authorizeRoles("customer"),
  validateTaskPayment,
  createPaymentIntent
);

router.post(
  "/:id",
  protect,
  authorizeRoles("customer"),
  validateTaskPayment,
  makePayment
);

export default router;