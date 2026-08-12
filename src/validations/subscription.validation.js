import ApiError from "../utils/ApiError.js";

export const validatePlanPayload = (req, res, next) => {
  const { name, price, durationDays } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Plan name must be at least 2 characters");
  }
  if (price === undefined || Number(price) < 0) {
    errors.push("Price must be a non-negative number");
  }
  if (!durationDays || Number(durationDays) <= 0) {
    errors.push("Duration (days) must be a positive number");
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }
  next();
};

export const validateCreateOrder = (req, res, next) => {
  if (!req.body.planId) {
    throw new ApiError(400, "planId is required");
  }
  next();
};

export const validateVerifyPayment = (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing payment verification fields");
  }
  next();
};
