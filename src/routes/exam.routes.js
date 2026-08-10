import express from "express";
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  togglePublishExam,
  deleteExam,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getExamAttempts,
} from "../controllers/exam.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import { validateExamPayload, validateSectionPayload } from "../validations/exam.validation.js";

const router = express.Router();

router.use(protect);

router.get("/", getExams);
router.get("/:id", getExamById);
router.post("/", authorize("admin"), validateExamPayload, createExam);
router.put("/:id", authorize("admin"), updateExam);
router.patch("/:id/publish", authorize("admin"), togglePublishExam);
router.delete("/:id", authorize("admin"), deleteExam);

router.get("/:examId/sections", getSections);
router.post("/:examId/sections", authorize("admin"), validateSectionPayload, createSection);
router.put("/:examId/sections/:sectionId", authorize("admin"), updateSection);
router.delete("/:examId/sections/:sectionId", authorize("admin"), deleteSection);

router.get("/:examId/attempts", authorize("admin"), getExamAttempts);

export default router;
