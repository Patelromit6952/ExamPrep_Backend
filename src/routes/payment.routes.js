import express from "express";
import {
  createOrder,
  verifyPayment,
  razorpayWebhook
} from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  validateCreateOrder,
  validateVerifyPayment
} from "../validations/subscription.validation.js";

const router = express.Router();

// Razorpay calls this server-to-server - must stay outside `protect`,
// it authenticates itself via the x-razorpay-signature header instead.
router.post("/webhook", razorpayWebhook);

router.use(protect);
router.post("/create-order", validateCreateOrder, createOrder);
router.post("/verify", validateVerifyPayment, verifyPayment);

export default router;
