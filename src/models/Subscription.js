import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true
    },
    // created  -> Razorpay order created, payment not yet completed
    // active   -> payment verified, subscription currently entitles access
    // expired  -> endDate has passed
    // failed   -> payment failed / was abandoned
    // cancelled-> manually cancelled (reserved for future use)
    status: {
      type: String,
      enum: ["created", "active", "expired", "failed", "cancelled"],
      default: "created"
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null }
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ razorpayOrderId: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
