// import mongoose from "mongoose";
// import Exam from "../models/Exam.js";
// import Question from "../models/Question.js";
// import Attempt from "../models/Attempt.js";
// import AttemptAnswer from "../models/AttemptAnswer.js";
// import asyncHandler from "../utils/asyncHandler.js";
// import ApiError from "../utils/ApiError.js";
// import ApiResponse from "../utils/ApiResponse.js";

// // Fisher-Yates shuffle - returns a new shuffled array, does not mutate input
// const shuffle = (arr) => {
//   const copy = [...arr];
//   for (let i = copy.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [copy[i], copy[j]] = [copy[j], copy[i]];
//   }
//   return copy;
// };

// /**
//  * Scores a completed attempt: for every question, +marks if the selected
//  * option is correct, -negativeMarks if wrong-and-answered, 0 if unanswered.
//  * Persists the final Attempt fields and returns them.
//  */
// const finalizeAttempt = async (attempt, exam, finalStatus) => {
//   const answers = await AttemptAnswer.find({ attemptId: attempt._id });
//   const questions = await Question.find({ _id: { $in: attempt.questionOrder } }).lean();
//   const questionMap = new Map(questions.map((q) => [String(q._id), q]));

//   let score = 0;
//   let correctCount = 0;
//   let wrongCount = 0;
//   let unansweredCount = 0;

//   for (const answer of answers) {
//     const question = questionMap.get(String(answer.questionId));
//     if (!question) continue;

//     if (!answer.isAnswered || !answer.selectedOptionId) {
//       unansweredCount += 1;
//       continue;
//     }

//     if (answer.selectedOptionId === question.correctOptionId) {
//       correctCount += 1;
//       score += question.marks;
//     } else {
//       wrongCount += 1;
//       score -= exam.negativeMarks || 0;
//     }
//   }

//   attempt.status = finalStatus;
//   attempt.submittedAt = new Date();
//   attempt.score = Math.round(score * 100) / 100;
//   attempt.totalQuestions = attempt.questionOrder.length;
//   attempt.correctCount = correctCount;
//   attempt.wrongCount = wrongCount;
//   attempt.unansweredCount = unansweredCount;

//   await attempt.save();
//   return attempt;
// };

// /**
//  * If an in-progress attempt has passed its deadline, auto-submit it.
//  * Called lazily whenever an attempt is fetched, so no cron/queue is needed.
//  */
// const autoSubmitIfExpired = async (attempt, exam) => {
//   if (attempt.status === "in-progress" && attempt.endsAt.getTime() <= Date.now()) {
//     return finalizeAttempt(attempt, exam, "auto-submitted");
//   }
//   return attempt;
// };

// // @desc    Start a new attempt, or resume an existing in-progress one
// // @route   POST /api/attempts/start/:examId
// // @access  Private/Student
// export const startAttempt = asyncHandler(async (req, res) => {
//   const { examId } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(examId)) {
//     throw new ApiError(400, "Invalid exam id");
//   }

//   const exam = await Exam.findById(examId);
//   if (!exam || !exam.isPublished) {
//     throw new ApiError(404, "Exam not found or not available");
//   }

//   // Resume an existing in-progress attempt if one exists
//   const existing = await Attempt.findOne({
//     userId: req.user._id,
//     examId,
//     status: "in-progress",
//   });

//   if (existing) {
//     const attempt = await autoSubmitIfExpired(existing, exam);
//     if (attempt.status === "in-progress") {
//       return res
//         .status(200)
//         .json(new ApiResponse(200, { attemptId: attempt._id, resumed: true }, "Resuming existing attempt"));
//     }
//     // fell through: it just got auto-submitted, so start a fresh one below
//   }

//   const questions = await Question.find({ examId }).lean();
//   if (questions.length === 0) {
//     throw new ApiError(400, "This exam has no questions yet");
//   }

//   const questionOrder = shuffle(questions.map((q) => q._id));

//   const optionOrders = new Map();
//   questions.forEach((q) => {
//     optionOrders.set(String(q._id), shuffle(q.options.map((o) => o.id)));
//   });

//   const startedAt = new Date();
//   const endsAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);

//   const attempt = await Attempt.create({
//     userId: req.user._id,
//     examId,
//     startedAt,
//     endsAt,
//     questionOrder,
//     optionOrders,
//     totalQuestions: questions.length,
//   });

//   // Pre-create one AttemptAnswer stub per question so the palette can show
//   // an accurate "not visited" state from question one.
//   const stubs = questions.map((q) => ({
//     attemptId: attempt._id,
//     questionId: q._id,
//   }));
//   await AttemptAnswer.insertMany(stubs);

//   res
//     .status(201)
//     .json(new ApiResponse(201, { attemptId: attempt._id, resumed: false }, "Attempt started"));
// });

// /**
//  * Shapes a question document for the client, applying the attempt's shuffled
//  * option order and stripping the correct answer unless the attempt is over.
//  */
// const buildQuestionView = (question, shuffledOptionIds, revealAnswer) => {
//   const optionsById = new Map(question.options.map((o) => [o.id, o]));
//   const orderedOptions = (shuffledOptionIds && shuffledOptionIds.length
//     ? shuffledOptionIds
//     : question.options.map((o) => o.id)
//   )
//     .map((id) => optionsById.get(id))
//     .filter(Boolean);

//   const base = {
//     _id: question._id,
//     questionText: question.questionText,
//     options: orderedOptions,
//     marks: question.marks,
//     topic: question.topic,
//     difficulty: question.difficulty,
//     sectionId: question.sectionId,
//   };

//   if (revealAnswer) {
//     base.correctOptionId = question.correctOptionId;
//     base.explanation = question.explanation;
//   }

//   return base;
// };

// // @desc    Get full attempt state: questions (in randomized order, options
// //          shuffled), current answers, and timing info for the countdown.
// // @route   GET /api/attempts/:attemptId
// // @access  Private/Student (own attempt) or Admin
// export const getAttempt = asyncHandler(async (req, res) => {
//   const attempt = await Attempt.findById(req.params.attemptId);
//   if (!attempt) {
//     throw new ApiError(404, "Attempt not found");
//   }

//   const isOwner = String(attempt.userId) === String(req.user._id);
//   if (!isOwner && req.user.role !== "admin") {
//     throw new ApiError(403, "You do not have access to this attempt");
//   }

//   const exam = await Exam.findById(attempt.examId).lean();
//   const finalAttempt = await autoSubmitIfExpired(attempt, exam);

//   const isOver = finalAttempt.status !== "in-progress";

//   const questions = await Question.find({ _id: { $in: finalAttempt.questionOrder } }).lean();
//   const questionMap = new Map(questions.map((q) => [String(q._id), q]));

//   const orderedQuestions = finalAttempt.questionOrder
//     .map((qId) => {
//       const q = questionMap.get(String(qId));
//       if (!q) return null;
//       const shuffledOptionIds = finalAttempt.optionOrders.get(String(qId));
//       return buildQuestionView(q, shuffledOptionIds, isOver);
//     })
//     .filter(Boolean);

//   const answerDocs = await AttemptAnswer.find({ attemptId: finalAttempt._id }).lean();
//   const answers = answerDocs.map((a) => ({
//     questionId: a.questionId,
//     selectedOptionId: a.selectedOptionId,
//     markedForReview: a.markedForReview,
//     isAnswered: a.isAnswered,
//     isVisited: a.isVisited,
//   }));

//   res.status(200).json(
//     new ApiResponse(
//       200,
//       {
//         attempt: {
//           _id: finalAttempt._id,
//           examId: finalAttempt.examId,
//           status: finalAttempt.status,
//           startedAt: finalAttempt.startedAt,
//           endsAt: finalAttempt.endsAt,
//           submittedAt: finalAttempt.submittedAt,
//           score: finalAttempt.score,
//           correctCount: finalAttempt.correctCount,
//           wrongCount: finalAttempt.wrongCount,
//           unansweredCount: finalAttempt.unansweredCount,
//           totalQuestions: finalAttempt.totalQuestions,
//         },
//         exam: {
//           _id: exam._id,
//           title: exam.title,
//           durationMinutes: exam.durationMinutes,
//           totalMarks: exam.totalMarks,
//           negativeMarks: exam.negativeMarks,
//           instructions: exam.instructions,
//         },
//         questions: orderedQuestions,
//         answers,
//         serverTime: new Date(),
//       },
//       "Attempt fetched"
//     )
//   );
// });

// const assertAttemptIsActive = (attempt) => {
//   if (attempt.status !== "in-progress") {
//     throw new ApiError(400, "This attempt has already been submitted");
//   }
//   if (attempt.endsAt.getTime() <= Date.now()) {
//     throw new ApiError(400, "Time is up for this attempt");
//   }
// };

// // @desc    Save/auto-save an answer for a question (also marks it visited).
// //          Pass selectedOptionId: null to clear the response.
// // @route   PUT /api/attempts/:attemptId/answer
// // @access  Private/Student
// export const saveAnswer = asyncHandler(async (req, res) => {
//   const { questionId, selectedOptionId } = req.body;

//   const attempt = await Attempt.findById(req.params.attemptId);
//   if (!attempt) throw new ApiError(404, "Attempt not found");
//   if (String(attempt.userId) !== String(req.user._id)) {
//     throw new ApiError(403, "You do not have access to this attempt");
//   }
//   assertAttemptIsActive(attempt);

//   const isAnswered = selectedOptionId !== null && selectedOptionId !== undefined;

//   const answer = await AttemptAnswer.findOneAndUpdate(
//     { attemptId: attempt._id, questionId },
//     {
//       $set: {
//         selectedOptionId: isAnswered ? selectedOptionId : null,
//         isAnswered,
//         isVisited: true,
//         savedAt: new Date(),
//       },
//     },
//     { new: true, upsert: true }
//   );

//   res.status(200).json(new ApiResponse(200, { answer }, "Answer saved"));
// });

// // @desc    Toggle "mark for review" for a question (also marks it visited)
// // @route   PUT /api/attempts/:attemptId/review
// // @access  Private/Student
// export const toggleReview = asyncHandler(async (req, res) => {
//   const { questionId, markedForReview } = req.body;

//   const attempt = await Attempt.findById(req.params.attemptId);
//   if (!attempt) throw new ApiError(404, "Attempt not found");
//   if (String(attempt.userId) !== String(req.user._id)) {
//     throw new ApiError(403, "You do not have access to this attempt");
//   }
//   assertAttemptIsActive(attempt);

//   const answer = await AttemptAnswer.findOneAndUpdate(
//     { attemptId: attempt._id, questionId },
//     {
//       $set: {
//         markedForReview: Boolean(markedForReview),
//         isVisited: true,
//       },
//     },
//     { new: true, upsert: true }
//   );

//   res.status(200).json(new ApiResponse(200, { answer }, "Review status updated"));
// });

// // @desc    Submit an attempt (manual submit, with confirmation on the client)
// // @route   POST /api/attempts/:attemptId/submit
// // @access  Private/Student
// export const submitAttempt = asyncHandler(async (req, res) => {
//   const attempt = await Attempt.findById(req.params.attemptId);
//   if (!attempt) throw new ApiError(404, "Attempt not found");
//   if (String(attempt.userId) !== String(req.user._id)) {
//     throw new ApiError(403, "You do not have access to this attempt");
//   }
//   if (attempt.status !== "in-progress") {
//     throw new ApiError(400, "This attempt has already been submitted");
//   }

//   const exam = await Exam.findById(attempt.examId).lean();
//   const finalized = await finalizeAttempt(attempt, exam, "submitted");

//   res.status(200).json(new ApiResponse(200, { attempt: finalized }, "Exam submitted successfully"));
// });

// // @desc    Get all past attempts (submitted / auto-submitted) for the
// //          logged-in student, most recent first.
// // @route   GET /api/attempts/history/me
// // @access  Private/Student
// export const getMyHistory = asyncHandler(async (req, res) => {
//   const attempts = await Attempt.find({
//     userId: req.user._id,
//     status: { $in: ["submitted", "auto-submitted"] },
//   })
//     .populate("examId", "title category totalMarks durationMinutes")
//     .sort({ submittedAt: -1 })
//     .lean();

//   res.status(200).json(new ApiResponse(200, { attempts }, "Attempt history fetched"));
// });

// // @desc    Topic-wise performance summary aggregated across all of the
// //          logged-in student's submitted attempts.
// // @route   GET /api/attempts/performance/topics
// // @access  Private/Student
// export const getTopicPerformance = asyncHandler(async (req, res) => {
//   const attempts = await Attempt.find({
//     userId: req.user._id,
//     status: { $in: ["submitted", "auto-submitted"] },
//   })
//     .select("_id")
//     .lean();
//   const attemptIds = attempts.map((a) => a._id);

//   if (attemptIds.length === 0) {
//     return res
//       .status(200)
//       .json(new ApiResponse(200, { topics: [] }, "Topic performance fetched"));
//   }

//   const answers = await AttemptAnswer.find({
//     attemptId: { $in: attemptIds },
//     isAnswered: true,
//   }).lean();

//   const questionIds = answers.map((a) => a.questionId);
//   const questions = await Question.find({ _id: { $in: questionIds } })
//     .select("topic correctOptionId")
//     .lean();
//   const questionMap = new Map(questions.map((q) => [String(q._id), q]));

//   const topicStats = new Map(); // topic -> { attempted, correct }

//   for (const answer of answers) {
//     const question = questionMap.get(String(answer.questionId));
//     if (!question) continue;
//     const topic = question.topic || "General";
//     if (!topicStats.has(topic)) topicStats.set(topic, { attempted: 0, correct: 0 });
//     const stats = topicStats.get(topic);
//     stats.attempted += 1;
//     if (answer.selectedOptionId === question.correctOptionId) stats.correct += 1;
//   }

//   const topics = Array.from(topicStats.entries()).map(([topic, stats]) => ({
//     topic,
//     attempted: stats.attempted,
//     correct: stats.correct,
//     accuracy: stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0,
//   }));

//   topics.sort((a, b) => b.attempted - a.attempted);

//   res.status(200).json(new ApiResponse(200, { topics }, "Topic performance fetched"));
// });

import mongoose from "mongoose";
import Exam from "../models/Exam.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";
import AttemptAnswer from "../models/AttemptAnswer.js";
import Subscription from "../models/Subscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// Fisher-Yates shuffle - returns a new shuffled array, does not mutate input
const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Scores a completed attempt: for every question, +marks if the selected
 * option is correct, -negativeMarks if wrong-and-answered, 0 if unanswered.
 * Persists the final Attempt fields and returns them.
 */
const finalizeAttempt = async (attempt, exam, finalStatus) => {
  const answers = await AttemptAnswer.find({ attemptId: attempt._id });
  const questions = await Question.find({
    _id: { $in: attempt.questionOrder }
  }).lean();
  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  for (const answer of answers) {
    const question = questionMap.get(String(answer.questionId));
    if (!question) continue;

    if (!answer.isAnswered || !answer.selectedOptionId) {
      unansweredCount += 1;
      continue;
    }

    if (answer.selectedOptionId === question.correctOptionId) {
      correctCount += 1;
      score += question.marks;
    } else {
      wrongCount += 1;
      score -= exam.negativeMarks || 0;
    }
  }

  attempt.status = finalStatus;
  attempt.submittedAt = new Date();
  attempt.score = Math.round(score * 100) / 100;
  attempt.totalQuestions = attempt.questionOrder.length;
  attempt.correctCount = correctCount;
  attempt.wrongCount = wrongCount;
  attempt.unansweredCount = unansweredCount;

  await attempt.save();
  return attempt;
};

/**
 * If an in-progress attempt has passed its deadline, auto-submit it.
 * Called lazily whenever an attempt is fetched, so no cron/queue is needed.
 */
const autoSubmitIfExpired = async (attempt, exam) => {
  if (
    attempt.status === "in-progress" &&
    attempt.endsAt.getTime() <= Date.now()
  ) {
    return finalizeAttempt(attempt, exam, "auto-submitted");
  }
  return attempt;
};

// @desc    Start a new attempt, or resume an existing in-progress one
// @route   POST /api/attempts/start/:examId
// @access  Private/Student
export const startAttempt = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(examId)) {
    throw new ApiError(400, "Invalid exam id");
  }

  const exam = await Exam.findById(examId);
  if (!exam || !exam.isPublished) {
    throw new ApiError(404, "Exam not found or not available");
  }

  if (exam.isPremium) {
    const hasActiveSubscription = await Subscription.exists({
      userId: req.user._id,
      status: "active",
      endDate: { $gt: new Date() }
    });
    if (!hasActiveSubscription) {
      throw new ApiError(
        402,
        "This is a premium exam. Please subscribe to access it.",
        ["subscription-required"]
      );
    }
  }

  // Resume an existing in-progress attempt if one exists
  const existing = await Attempt.findOne({
    userId: req.user._id,
    examId,
    status: "in-progress"
  });

  if (existing) {
    const attempt = await autoSubmitIfExpired(existing, exam);
    if (attempt.status === "in-progress") {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { attemptId: attempt._id, resumed: true },
            "Resuming existing attempt"
          )
        );
    }
    // fell through: it just got auto-submitted, so start a fresh one below
  }

  const questions = await Question.find({ examId }).lean();
  if (questions.length === 0) {
    throw new ApiError(400, "This exam has no questions yet");
  }

  const questionOrder = shuffle(questions.map((q) => q._id));

  const optionOrders = new Map();
  questions.forEach((q) => {
    optionOrders.set(String(q._id), shuffle(q.options.map((o) => o.id)));
  });

  const startedAt = new Date();
  const endsAt = new Date(
    startedAt.getTime() + exam.durationMinutes * 60 * 1000
  );

  const attempt = await Attempt.create({
    userId: req.user._id,
    examId,
    startedAt,
    endsAt,
    questionOrder,
    optionOrders,
    totalQuestions: questions.length
  });

  // Pre-create one AttemptAnswer stub per question so the palette can show
  // an accurate "not visited" state from question one.
  const stubs = questions.map((q) => ({
    attemptId: attempt._id,
    questionId: q._id
  }));
  await AttemptAnswer.insertMany(stubs);

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { attemptId: attempt._id, resumed: false },
        "Attempt started"
      )
    );
});

/**
 * Shapes a question document for the client, applying the attempt's shuffled
 * option order and stripping the correct answer unless the attempt is over.
 */
const buildQuestionView = (question, shuffledOptionIds, revealAnswer) => {
  const optionsById = new Map(question.options.map((o) => [o.id, o]));
  const orderedOptions = (
    shuffledOptionIds && shuffledOptionIds.length
      ? shuffledOptionIds
      : question.options.map((o) => o.id)
  )
    .map((id) => optionsById.get(id))
    .filter(Boolean);

  const base = {
    _id: question._id,
    questionText: question.questionText,
    options: orderedOptions,
    marks: question.marks,
    topic: question.topic,
    difficulty: question.difficulty,
    sectionId: question.sectionId
  };

  if (revealAnswer) {
    base.correctOptionId = question.correctOptionId;
    base.explanation = question.explanation;
  }

  return base;
};

// @desc    Get full attempt state: questions (in randomized order, options
//          shuffled), current answers, and timing info for the countdown.
// @route   GET /api/attempts/:attemptId
// @access  Private/Student (own attempt) or Admin
export const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.attemptId);
  if (!attempt) {
    throw new ApiError(404, "Attempt not found");
  }

  const isOwner = String(attempt.userId) === String(req.user._id);
  if (!isOwner && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have access to this attempt");
  }

  const exam = await Exam.findById(attempt.examId).lean();
  const finalAttempt = await autoSubmitIfExpired(attempt, exam);

  const isOver = finalAttempt.status !== "in-progress";

  const questions = await Question.find({
    _id: { $in: finalAttempt.questionOrder }
  }).lean();
  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  const orderedQuestions = finalAttempt.questionOrder
    .map((qId) => {
      const q = questionMap.get(String(qId));
      if (!q) return null;
      const shuffledOptionIds = finalAttempt.optionOrders.get(String(qId));
      return buildQuestionView(q, shuffledOptionIds, isOver);
    })
    .filter(Boolean);

  const answerDocs = await AttemptAnswer.find({
    attemptId: finalAttempt._id
  }).lean();
  const answers = answerDocs.map((a) => ({
    questionId: a.questionId,
    selectedOptionId: a.selectedOptionId,
    markedForReview: a.markedForReview,
    isAnswered: a.isAnswered,
    isVisited: a.isVisited
  }));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        attempt: {
          _id: finalAttempt._id,
          examId: finalAttempt.examId,
          status: finalAttempt.status,
          startedAt: finalAttempt.startedAt,
          endsAt: finalAttempt.endsAt,
          submittedAt: finalAttempt.submittedAt,
          score: finalAttempt.score,
          correctCount: finalAttempt.correctCount,
          wrongCount: finalAttempt.wrongCount,
          unansweredCount: finalAttempt.unansweredCount,
          totalQuestions: finalAttempt.totalQuestions
        },
        exam: {
          _id: exam._id,
          title: exam.title,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          negativeMarks: exam.negativeMarks,
          instructions: exam.instructions
        },
        questions: orderedQuestions,
        answers,
        serverTime: new Date()
      },
      "Attempt fetched"
    )
  );
});

const assertAttemptIsActive = (attempt) => {
  if (attempt.status !== "in-progress") {
    throw new ApiError(400, "This attempt has already been submitted");
  }
  if (attempt.endsAt.getTime() <= Date.now()) {
    throw new ApiError(400, "Time is up for this attempt");
  }
};

// @desc    Save/auto-save an answer for a question (also marks it visited).
//          Pass selectedOptionId: null to clear the response.
// @route   PUT /api/attempts/:attemptId/answer
// @access  Private/Student
export const saveAnswer = asyncHandler(async (req, res) => {
  const { questionId, selectedOptionId } = req.body;

  const attempt = await Attempt.findById(req.params.attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (String(attempt.userId) !== String(req.user._id)) {
    throw new ApiError(403, "You do not have access to this attempt");
  }
  assertAttemptIsActive(attempt);

  const isAnswered =
    selectedOptionId !== null && selectedOptionId !== undefined;

  const answer = await AttemptAnswer.findOneAndUpdate(
    { attemptId: attempt._id, questionId },
    {
      $set: {
        selectedOptionId: isAnswered ? selectedOptionId : null,
        isAnswered,
        isVisited: true,
        savedAt: new Date()
      }
    },
    { new: true, upsert: true }
  );

  res.status(200).json(new ApiResponse(200, { answer }, "Answer saved"));
});

// @desc    Toggle "mark for review" for a question (also marks it visited)
// @route   PUT /api/attempts/:attemptId/review
// @access  Private/Student
export const toggleReview = asyncHandler(async (req, res) => {
  const { questionId, markedForReview } = req.body;

  const attempt = await Attempt.findById(req.params.attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (String(attempt.userId) !== String(req.user._id)) {
    throw new ApiError(403, "You do not have access to this attempt");
  }
  assertAttemptIsActive(attempt);

  const answer = await AttemptAnswer.findOneAndUpdate(
    { attemptId: attempt._id, questionId },
    {
      $set: {
        markedForReview: Boolean(markedForReview),
        isVisited: true
      }
    },
    { new: true, upsert: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, { answer }, "Review status updated"));
});

// @desc    Submit an attempt (manual submit, with confirmation on the client)
// @route   POST /api/attempts/:attemptId/submit
// @access  Private/Student
export const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (String(attempt.userId) !== String(req.user._id)) {
    throw new ApiError(403, "You do not have access to this attempt");
  }
  if (attempt.status !== "in-progress") {
    throw new ApiError(400, "This attempt has already been submitted");
  }

  const exam = await Exam.findById(attempt.examId).lean();
  const finalized = await finalizeAttempt(attempt, exam, "submitted");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { attempt: finalized },
        "Exam submitted successfully"
      )
    );
});

// @desc    Get all past attempts (submitted / auto-submitted) for the
//          logged-in student, most recent first.
// @route   GET /api/attempts/history/me
// @access  Private/Student
export const getMyHistory = asyncHandler(async (req, res) => {
  const attempts = await Attempt.find({
    userId: req.user._id,
    status: { $in: ["submitted", "auto-submitted"] }
  })
    .populate("examId", "title category totalMarks durationMinutes")
    .sort({ submittedAt: -1 })
    .lean();

  res
    .status(200)
    .json(new ApiResponse(200, { attempts }, "Attempt history fetched"));
});

// @desc    Topic-wise performance summary aggregated across all of the
//          logged-in student's submitted attempts.
// @route   GET /api/attempts/performance/topics
// @access  Private/Student
export const getTopicPerformance = asyncHandler(async (req, res) => {
  const attempts = await Attempt.find({
    userId: req.user._id,
    status: { $in: ["submitted", "auto-submitted"] }
  })
    .select("_id")
    .lean();
  const attemptIds = attempts.map((a) => a._id);

  if (attemptIds.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, { topics: [] }, "Topic performance fetched"));
  }

  const answers = await AttemptAnswer.find({
    attemptId: { $in: attemptIds },
    isAnswered: true
  }).lean();

  const questionIds = answers.map((a) => a.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } })
    .select("topic correctOptionId")
    .lean();
  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  const topicStats = new Map(); // topic -> { attempted, correct }

  for (const answer of answers) {
    const question = questionMap.get(String(answer.questionId));
    if (!question) continue;
    const topic = question.topic || "General";
    if (!topicStats.has(topic))
      topicStats.set(topic, { attempted: 0, correct: 0 });
    const stats = topicStats.get(topic);
    stats.attempted += 1;
    if (answer.selectedOptionId === question.correctOptionId)
      stats.correct += 1;
  }

  const topics = Array.from(topicStats.entries()).map(([topic, stats]) => ({
    topic,
    attempted: stats.attempted,
    correct: stats.correct,
    accuracy:
      stats.attempted > 0
        ? Math.round((stats.correct / stats.attempted) * 100)
        : 0
  }));

  topics.sort((a, b) => b.attempted - a.attempted);

  res
    .status(200)
    .json(new ApiResponse(200, { topics }, "Topic performance fetched"));
});