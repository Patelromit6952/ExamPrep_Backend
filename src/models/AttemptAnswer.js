import mongoose from "mongoose";

const attemptAnswerSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOptionId: {
      type: String,
      default: null,
    },
    markedForReview: {
      type: Boolean,
      default: false,
    },
    isAnswered: {
      type: Boolean,
      default: false,
    },
    isVisited: {
      type: Boolean,
      default: false,
    },
    savedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One answer document per (attempt, question) pair
attemptAnswerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });

const AttemptAnswer = mongoose.model("AttemptAnswer", attemptAnswerSchema);
export default AttemptAnswer;
