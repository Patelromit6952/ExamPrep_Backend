import Exam from "../models/Exam.js";
import Question from "../models/Question.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { parseQuestionsCsv, mapCsvRowToQuestion } from "../utils/csvParser.js";

// @desc    List questions for an exam (admin question bank view)
// @route   GET /api/questions?examId=...
// @access  Private/Admin
export const getQuestions = asyncHandler(async (req, res) => {
  const { examId, sectionId } = req.query;

  if (!examId) {
    throw new ApiError(400, "examId query parameter is required");
  }

  const filter = { examId };
  if (sectionId) filter.sectionId = sectionId;

  const questions = await Question.find(filter).sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, { questions }, "Questions fetched"));
});

// @desc    Create a single question manually
// @route   POST /api/questions
// @access  Private/Admin
export const createQuestion = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.body.examId);
  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  const {
    examId,
    sectionId,
    questionText,
    options,
    correctOptionId,
    marks,
    explanation,
    difficulty,
    topic
  } = req.body;

  const question = await Question.create({
    examId,
    sectionId: sectionId || null,
    questionText,
    options,
    correctOptionId,
    marks,
    explanation,
    difficulty,
    topic
  });

  res
    .status(201)
    .json(new ApiResponse(201, { question }, "Question created successfully"));
});

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private/Admin
export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  const allowedFields = [
    "sectionId",
    "questionText",
    "options",
    "correctOptionId",
    "marks",
    "explanation",
    "difficulty",
    "topic"
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      question[field] = req.body[field];
    }
  });

  await question.save();

  res
    .status(200)
    .json(new ApiResponse(200, { question }, "Question updated successfully"));
});

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private/Admin
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  await Question.deleteOne({ _id: question._id });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Question deleted successfully"));
});

// @desc    Bulk upload questions from a CSV file
//          Columns: questionText, optionA, optionB, optionC, optionD,
//                    correctOption, marks, topic, difficulty, explanation
// @route   POST /api/questions/bulk-upload
// @access  Private/Admin
export const bulkUploadQuestions = asyncHandler(async (req, res) => {
  const { examId, sectionId } = req.body;

  if (!examId) {
    throw new ApiError(400, "examId is required");
  }
  if (!req.file) {
    throw new ApiError(400, "A CSV file is required (field name: file)");
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  let rows;
  try {
    rows = parseQuestionsCsv(req.file.buffer);
  } catch (err) {
    throw new ApiError(400, `Could not parse CSV: ${err.message}`);
  }

  if (rows.length === 0) {
    throw new ApiError(400, "CSV file has no data rows");
  }

  const toInsert = [];
  const rowErrors = [];

  rows.forEach((row, index) => {
    try {
      const question = mapCsvRowToQuestion(row, index + 2, examId, sectionId); // +2 = header row + 1-index
      toInsert.push(question);
    } catch (err) {
      rowErrors.push(err.message);
    }
  });

  let inserted = [];
  if (toInsert.length > 0) {
    inserted = await Question.insertMany(toInsert, { ordered: false });
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        successCount: inserted.length,
        errorCount: rowErrors.length,
        errors: rowErrors
      },
      `Bulk upload complete: ${inserted.length} added, ${rowErrors.length} failed`
    )
  );
});
