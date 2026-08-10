import express from "express";
import {
  startAttempt,
  getAttempt,
  saveAnswer,
  toggleReview,
  submitAttempt,
  getMyHistory,
  getTopicPerformance,
} from "../controllers/attempt.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateAnswerPayload, validateReviewPayload } from "../validations/attempt.validation.js";

const router = express.Router();

router.use(protect);

router.get("/history/me", getMyHistory);
router.get("/performance/topics", getTopicPerformance);
router.post("/start/:examId", startAttempt);
router.get("/:attemptId", getAttempt);
router.put("/:attemptId/answer", validateAnswerPayload, saveAnswer);
router.put("/:attemptId/review", validateReviewPayload, toggleReview);
router.post("/:attemptId/submit", submitAttempt);

export default router;
