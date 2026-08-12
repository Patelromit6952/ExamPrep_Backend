// import mongoose from "mongoose";
// import Exam from "../models/Exam.js";
// import Section from "../models/Section.js";
// import Question from "../models/Question.js";
// import Attempt from "../models/Attempt.js";
// import AttemptAnswer from "../models/AttemptAnswer.js";
// import asyncHandler from "../utils/asyncHandler.js";
// import ApiError from "../utils/ApiError.js";
// import ApiResponse from "../utils/ApiResponse.js";

// // @desc    List exams. Students see only published exams; admins can pass
// //          ?all=true to see every exam including drafts.
// // @route   GET /api/exams
// // @access  Private
// export const getExams = asyncHandler(async (req, res) => {
//   const wantsAll = req.query.all === "true" && req.user.role === "admin";
//   const filter = wantsAll ? {} : { isPublished: true };

//   const exams = await Exam.find(filter).sort({ createdAt: -1 }).lean();

//   // Attach a live question count so list cards can show "50 questions" etc.
//   const examIds = exams.map((e) => e._id);
//   const counts = await Question.aggregate([
//     { $match: { examId: { $in: examIds } } },
//     { $group: { _id: "$examId", count: { $sum: 1 } } },
//   ]);
//   const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

//   const examsWithCounts = exams.map((e) => ({
//     ...e,
//     questionCount: countMap.get(String(e._id)) || 0,
//   }));

//   res.status(200).json(new ApiResponse(200, { exams: examsWithCounts }, "Exams fetched"));
// });

// // @desc    Get a single exam with its sections
// // @route   GET /api/exams/:id
// // @access  Private
// export const getExamById = asyncHandler(async (req, res) => {
//   const exam = await Exam.findById(req.params.id).lean();

//   if (!exam) {
//     throw new ApiError(404, "Exam not found");
//   }

//   if (!exam.isPublished && req.user.role !== "admin") {
//     throw new ApiError(403, "This exam is not currently available");
//   }

//   const sections = await Section.find({ examId: exam._id }).sort({ order: 1 }).lean();
//   const questionCount = await Question.countDocuments({ examId: exam._id });

//   res
//     .status(200)
//     .json(new ApiResponse(200, { exam, sections, questionCount }, "Exam fetched"));
// });

// // @desc    Create a new exam
// // @route   POST /api/exams
// // @access  Private/Admin
// export const createExam = asyncHandler(async (req, res) => {
//   const { title, description, category, durationMinutes, totalMarks, negativeMarks, instructions } =
//     req.body;

//   const exam = await Exam.create({
//     title,
//     description,
//     category,
//     durationMinutes,
//     totalMarks,
//     negativeMarks: negativeMarks || 0,
//     instructions: Array.isArray(instructions) ? instructions : [],
//     createdBy: req.user._id,
//   });

//   res.status(201).json(new ApiResponse(201, { exam }, "Exam created successfully"));
// });

// // @desc    Update an exam (including publish/unpublish via isPublished)
// // @route   PUT /api/exams/:id
// // @access  Private/Admin
// export const updateExam = asyncHandler(async (req, res) => {
//   const exam = await Exam.findById(req.params.id);
//   if (!exam) {
//     throw new ApiError(404, "Exam not found");
//   }

//   const allowedFields = [
//     "title",
//     "description",
//     "category",
//     "durationMinutes",
//     "totalMarks",
//     "negativeMarks",
//     "instructions",
//     "isPublished",
//   ];

//   allowedFields.forEach((field) => {
//     if (req.body[field] !== undefined) {
//       exam[field] = req.body[field];
//     }
//   });

//   await exam.save();

//   res.status(200).json(new ApiResponse(200, { exam }, "Exam updated successfully"));
// });

// // @desc    Toggle publish/unpublish state for an exam
// // @route   PATCH /api/exams/:id/publish
// // @access  Private/Admin
// export const togglePublishExam = asyncHandler(async (req, res) => {
//   const exam = await Exam.findById(req.params.id);
//   if (!exam) {
//     throw new ApiError(404, "Exam not found");
//   }

//   if (!exam.isPublished) {
//     const questionCount = await Question.countDocuments({ examId: exam._id });
//     if (questionCount === 0) {
//       throw new ApiError(400, "Add at least one question before publishing this exam");
//     }
//   }

//   exam.isPublished = !exam.isPublished;
//   await exam.save();

//   res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         { exam },
//         exam.isPublished ? "Exam published" : "Exam unpublished"
//       )
//     );
// });

// // @desc    Delete an exam and cascade-delete its sections, questions,
// //          attempts and attempt answers.
// // @route   DELETE /api/exams/:id
// // @access  Private/Admin
// export const deleteExam = asyncHandler(async (req, res) => {
//   const exam = await Exam.findById(req.params.id);
//   if (!exam) {
//     throw new ApiError(404, "Exam not found");
//   }

//   const attempts = await Attempt.find({ examId: exam._id }).select("_id").lean();
//   const attemptIds = attempts.map((a) => a._id);

//   await Promise.all([
//     AttemptAnswer.deleteMany({ attemptId: { $in: attemptIds } }),
//     Attempt.deleteMany({ examId: exam._id }),
//     Question.deleteMany({ examId: exam._id }),
//     Section.deleteMany({ examId: exam._id }),
//     Exam.deleteOne({ _id: exam._id }),
//   ]);

//   res.status(200).json(new ApiResponse(200, null, "Exam deleted successfully"));
// });

// // ---------------------------------------------------------------------------
// // Sections
// // ---------------------------------------------------------------------------

// // @desc    List sections for an exam
// // @route   GET /api/exams/:examId/sections
// // @access  Private
// export const getSections = asyncHandler(async (req, res) => {
//   const sections = await Section.find({ examId: req.params.examId }).sort({ order: 1 });
//   res.status(200).json(new ApiResponse(200, { sections }, "Sections fetched"));
// });

// // @desc    Create a section under an exam
// // @route   POST /api/exams/:examId/sections
// // @access  Private/Admin
// export const createSection = asyncHandler(async (req, res) => {
//   const exam = await Exam.findById(req.params.examId);
//   if (!exam) {
//     throw new ApiError(404, "Exam not found");
//   }

//   const { title, order } = req.body;
//   const existingCount = await Section.countDocuments({ examId: exam._id });

//   const section = await Section.create({
//     examId: exam._id,
//     title,
//     order: order !== undefined ? order : existingCount,
//   });

//   res.status(201).json(new ApiResponse(201, { section }, "Section created successfully"));
// });

// // @desc    Update a section
// // @route   PUT /api/exams/:examId/sections/:sectionId
// // @access  Private/Admin
// export const updateSection = asyncHandler(async (req, res) => {
//   const section = await Section.findOne({
//     _id: req.params.sectionId,
//     examId: req.params.examId,
//   });

//   if (!section) {
//     throw new ApiError(404, "Section not found");
//   }

//   if (req.body.title !== undefined) section.title = req.body.title;
//   if (req.body.order !== undefined) section.order = req.body.order;

//   await section.save();

//   res.status(200).json(new ApiResponse(200, { section }, "Section updated successfully"));
// });

// // @desc    Delete a section (questions under it become unsectioned)
// // @route   DELETE /api/exams/:examId/sections/:sectionId
// // @access  Private/Admin
// export const deleteSection = asyncHandler(async (req, res) => {
//   const section = await Section.findOne({
//     _id: req.params.sectionId,
//     examId: req.params.examId,
//   });

//   if (!section) {
//     throw new ApiError(404, "Section not found");
//   }

//   await Question.updateMany({ sectionId: section._id }, { $set: { sectionId: null } });
//   await Section.deleteOne({ _id: section._id });

//   res.status(200).json(new ApiResponse(200, null, "Section deleted successfully"));
// });

// // @desc    View all student attempts + scores for an exam (admin analytics)
// // @route   GET /api/exams/:examId/attempts
// // @access  Private/Admin
// export const getExamAttempts = asyncHandler(async (req, res) => {
//   const examId = req.params.examId;

//   if (!mongoose.Types.ObjectId.isValid(examId)) {
//     throw new ApiError(400, "Invalid exam id");
//   }

//   const attempts = await Attempt.find({
//     examId,
//     status: { $in: ["submitted", "auto-submitted"] },
//   })
//     .populate("userId", "name email")
//     .sort({ score: -1, submittedAt: 1 })
//     .lean();

//   res.status(200).json(new ApiResponse(200, { attempts }, "Exam attempts fetched"));
// });

import mongoose from "mongoose";
import Exam from "../models/Exam.js";
import Section from "../models/Section.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";
import AttemptAnswer from "../models/AttemptAnswer.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// @desc    List exams. Students see only published exams; admins can pass
//          ?all=true to see every exam including drafts.
// @route   GET /api/exams
// @access  Private
export const getExams = asyncHandler(async (req, res) => {
  const wantsAll = req.query.all === "true" && req.user.role === "admin";
  const filter = wantsAll ? {} : { isPublished: true };

  const exams = await Exam.find(filter).sort({ createdAt: -1 }).lean();

  // Attach a live question count so list cards can show "50 questions" etc.
  const examIds = exams.map((e) => e._id);
  const counts = await Question.aggregate([
    { $match: { examId: { $in: examIds } } },
    { $group: { _id: "$examId", count: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const examsWithCounts = exams.map((e) => ({
    ...e,
    questionCount: countMap.get(String(e._id)) || 0
  }));

  res
    .status(200)
    .json(new ApiResponse(200, { exams: examsWithCounts }, "Exams fetched"));
});

// @desc    Get a single exam with its sections
// @route   GET /api/exams/:id
// @access  Private
export const getExamById = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id).lean();

  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  if (!exam.isPublished && req.user.role !== "admin") {
    throw new ApiError(403, "This exam is not currently available");
  }

  const sections = await Section.find({ examId: exam._id })
    .sort({ order: 1 })
    .lean();
  const questionCount = await Question.countDocuments({ examId: exam._id });

  res
    .status(200)
    .json(
      new ApiResponse(200, { exam, sections, questionCount }, "Exam fetched")
    );
});

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private/Admin
export const createExam = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    durationMinutes,
    totalMarks,
    negativeMarks,
    instructions
  } = req.body;

  const exam = await Exam.create({
    title,
    description,
    category,
    durationMinutes,
    totalMarks,
    negativeMarks: negativeMarks || 0,
    instructions: Array.isArray(instructions) ? instructions : [],
    isPremium: Boolean(req.body.isPremium),
    createdBy: req.user._id
  });

  res
    .status(201)
    .json(new ApiResponse(201, { exam }, "Exam created successfully"));
});

// @desc    Update an exam (including publish/unpublish via isPublished)
// @route   PUT /api/exams/:id
// @access  Private/Admin
export const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  const allowedFields = [
    "title",
    "description",
    "category",
    "durationMinutes",
    "totalMarks",
    "negativeMarks",
    "instructions",
    "isPublished",
    "isPremium"
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      exam[field] = req.body[field];
    }
  });

  await exam.save();

  res
    .status(200)
    .json(new ApiResponse(200, { exam }, "Exam updated successfully"));
});

// @desc    Toggle publish/unpublish state for an exam
// @route   PATCH /api/exams/:id/publish
// @access  Private/Admin
export const togglePublishExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  if (!exam.isPublished) {
    const questionCount = await Question.countDocuments({ examId: exam._id });
    if (questionCount === 0) {
      throw new ApiError(
        400,
        "Add at least one question before publishing this exam"
      );
    }
  }

  exam.isPublished = !exam.isPublished;
  await exam.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { exam },
        exam.isPublished ? "Exam published" : "Exam unpublished"
      )
    );
});

// @desc    Delete an exam and cascade-delete its sections, questions,
//          attempts and attempt answers.
// @route   DELETE /api/exams/:id
// @access  Private/Admin
export const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  const attempts = await Attempt.find({ examId: exam._id })
    .select("_id")
    .lean();
  const attemptIds = attempts.map((a) => a._id);

  await Promise.all([
    AttemptAnswer.deleteMany({ attemptId: { $in: attemptIds } }),
    Attempt.deleteMany({ examId: exam._id }),
    Question.deleteMany({ examId: exam._id }),
    Section.deleteMany({ examId: exam._id }),
    Exam.deleteOne({ _id: exam._id })
  ]);

  res.status(200).json(new ApiResponse(200, null, "Exam deleted successfully"));
});

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

// @desc    List sections for an exam
// @route   GET /api/exams/:examId/sections
// @access  Private
export const getSections = asyncHandler(async (req, res) => {
  const sections = await Section.find({ examId: req.params.examId }).sort({
    order: 1
  });
  res.status(200).json(new ApiResponse(200, { sections }, "Sections fetched"));
});

// @desc    Create a section under an exam
// @route   POST /api/exams/:examId/sections
// @access  Private/Admin
export const createSection = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) {
    throw new ApiError(404, "Exam not found");
  }

  const { title, order } = req.body;
  const existingCount = await Section.countDocuments({ examId: exam._id });

  const section = await Section.create({
    examId: exam._id,
    title,
    order: order !== undefined ? order : existingCount
  });

  res
    .status(201)
    .json(new ApiResponse(201, { section }, "Section created successfully"));
});

// @desc    Update a section
// @route   PUT /api/exams/:examId/sections/:sectionId
// @access  Private/Admin
export const updateSection = asyncHandler(async (req, res) => {
  const section = await Section.findOne({
    _id: req.params.sectionId,
    examId: req.params.examId
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  if (req.body.title !== undefined) section.title = req.body.title;
  if (req.body.order !== undefined) section.order = req.body.order;

  await section.save();

  res
    .status(200)
    .json(new ApiResponse(200, { section }, "Section updated successfully"));
});

// @desc    Delete a section (questions under it become unsectioned)
// @route   DELETE /api/exams/:examId/sections/:sectionId
// @access  Private/Admin
export const deleteSection = asyncHandler(async (req, res) => {
  const section = await Section.findOne({
    _id: req.params.sectionId,
    examId: req.params.examId
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  await Question.updateMany(
    { sectionId: section._id },
    { $set: { sectionId: null } }
  );
  await Section.deleteOne({ _id: section._id });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Section deleted successfully"));
});

// @desc    View all student attempts + scores for an exam (admin analytics)
// @route   GET /api/exams/:examId/attempts
// @access  Private/Admin
export const getExamAttempts = asyncHandler(async (req, res) => {
  const examId = req.params.examId;

  if (!mongoose.Types.ObjectId.isValid(examId)) {
    throw new ApiError(400, "Invalid exam id");
  }

  const attempts = await Attempt.find({
    examId,
    status: { $in: ["submitted", "auto-submitted"] }
  })
    .populate("userId", "name email")
    .sort({ score: -1, submittedAt: 1 })
    .lean();

  res
    .status(200)
    .json(new ApiResponse(200, { attempts }, "Exam attempts fetched"));
});