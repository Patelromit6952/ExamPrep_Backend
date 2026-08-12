import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

let instance = null;

/** Lazily creates a single reusable Razorpay SDK instance from env credentials. */
export const getRazorpayInstance = () => {
  if (instance) return instance;

  instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  return instance;
};
