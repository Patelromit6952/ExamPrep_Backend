import Subscription from "../models/Subscription.js";
import dotenv from "dotenv";
dotenv.config();

const getFreeMaxAttemptsPerExam = () =>
  Number(process.env.FREE_MAX_ATTEMPTS_PER_EXAM) || 3;

/**
 * Resolves a user's active subscription (if any) and the number of times
 * they're allowed to attempt any ONE exam. A subscribed user's limit comes
 * from their plan; an unsubscribed user gets the platform-wide free-tier
 * default. In both cases, 0 means unlimited.
 */
export const getAttemptLimitContext = async (userId) => {
  const activeSubscription = await Subscription.findOne({
    userId,
    status: "active",
    endDate: { $gt: new Date() }
  }).populate("planId");

  const maxAttemptsPerExam = activeSubscription
    ? activeSubscription.planId?.maxAttemptsPerExam || 0
    : getFreeMaxAttemptsPerExam();

  return { activeSubscription, maxAttemptsPerExam };
};
