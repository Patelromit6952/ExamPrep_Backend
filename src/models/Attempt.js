import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Server-computed absolute deadline = startedAt + exam.durationMinutes.
    // This is the single source of truth for the countdown timer and for
    // deciding whether an attempt should be auto-submitted.
    endsAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["in-progress", "submitted", "auto-submitted"],
      default: "in-progress",
    },
    // Randomized order of question ids shown to this student for this attempt
    questionOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    // Per-question shuffled option order: Map<questionId string, string[] optionIds>
    optionOrders: {
      type: Map,
      of: [String],
      default: {},
    },
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    wrongCount: {
      type: Number,
      default: 0,
    },
    unansweredCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

attemptSchema.index({ userId: 1, examId: 1 });
attemptSchema.index({ userId: 1, status: 1 });

const Attempt = mongoose.model("Attempt", attemptSchema);
export default Attempt;
