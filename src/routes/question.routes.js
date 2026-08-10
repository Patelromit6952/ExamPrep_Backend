import express from "express";
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUploadQuestions,
} from "../controllers/question.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import { validateQuestionPayload } from "../validations/question.validation.js";
import { uploadCsv } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/", getQuestions);
router.post("/", validateQuestionPayload, createQuestion);
router.post("/bulk-upload", uploadCsv.single("file"), bulkUploadQuestions);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);

export default router;
