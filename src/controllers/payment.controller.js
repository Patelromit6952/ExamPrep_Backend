import crypto from "crypto";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { getRazorpayInstance } from "../utils/razorpay.js";

// @desc    Create a Razorpay order for a plan, plus a pending Subscription
//          record to reconcile once payment completes.
// @route   POST /api/payments/create-order
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
  const { planId } = req.body;

  const plan = await Plan.findById(planId);
  if (!plan || !plan.isActive) {
    throw new ApiError(404, "Plan not found or unavailable");
  }

  const amountInPaise = Math.round(plan.price * 100);

  const razorpay = getRazorpayInstance();
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: plan.currency || "INR",
    receipt: `sub_${req.user._id}_${Date.now()}`,
    notes: { userId: String(req.user._id), planId: String(plan._id) }
  });

  const subscription = await Subscription.create({
    userId: req.user._id,
    planId: plan._id,
    status: "created",
    amount: plan.price,
    currency: plan.currency || "INR",
    razorpayOrderId: order.id
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        subscriptionId: subscription._id,
        plan: { name: plan.name, durationDays: plan.durationDays }
      },
      "Order created"
    )
  );
});

/** Activates a subscription once its payment has been verified. */
const activateSubscription = async (subscription) => {
  const plan = subscription.planId?.durationDays
    ? subscription.planId
    : await Plan.findById(subscription.planId);
  const now = new Date();

  subscription.status = "active";
  subscription.startDate = now;
  subscription.endDate = new Date(
    now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
  );
  await subscription.save();
  return subscription;
};

// @desc    Verify a completed Razorpay checkout payment and activate the
//          subscription. This is the primary activation path (called by the
//          frontend from Razorpay's `handler` callback).
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed - signature mismatch");
  }

  const subscription = await Subscription.findOne({
    razorpayOrderId: razorpay_order_id
  }).populate("planId");
  if (!subscription) {
    throw new ApiError(404, "Subscription record not found for this order");
  }
  if (String(subscription.userId) !== String(req.user._id)) {
    throw new ApiError(403, "This payment does not belong to your account");
  }

  subscription.razorpayPaymentId = razorpay_payment_id;
  subscription.razorpaySignature = razorpay_signature;
  await activateSubscription(subscription);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscription },
        "Payment verified. Subscription activated!"
      )
    );
});

// @desc    Razorpay server-to-server webhook - a backup activation path in
//          case the browser is closed before the client-side verify call
//          completes. Configure this URL + secret in the Razorpay dashboard.
// @route   POST /api/payments/webhook
// @access  Public (verified via signature header, not auth cookie)
export const razorpayWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  if (!secret || !signature) {
    return res
      .status(400)
      .json({ success: false, message: "Webhook not configured" });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody || "")
    .digest("hex");
  if (signature !== expected) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid webhook signature" });
  }

  const event = req.body;

  if (event.event === "payment.captured") {
    const orderId = event.payload?.payment?.entity?.order_id;
    const paymentId = event.payload?.payment?.entity?.id;

    const subscription = await Subscription.findOne({
      razorpayOrderId: orderId
    }).populate("planId");
    if (subscription && subscription.status !== "active") {
      subscription.razorpayPaymentId = paymentId;
      await activateSubscription(subscription);
    }
  }

  res.status(200).json({ success: true });
});
