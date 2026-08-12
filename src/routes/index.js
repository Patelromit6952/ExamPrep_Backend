import express from "express";
import authRoutes from "./auth.routes.js";
import examRoutes from "./exam.routes.js";
import questionRoutes from "./question.routes.js";
import attemptRoutes from "./attempt.routes.js";
import subscriptionRoutes from "./subscription.routes.js";
import paymentRoutes from "./payment.routes.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "API is healthy", data: null });
});

router.use("/auth", authRoutes);
router.use("/exams", examRoutes);
router.use("/questions", questionRoutes);
router.use("/attempts", attemptRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/payments", paymentRoutes);

export default router;
