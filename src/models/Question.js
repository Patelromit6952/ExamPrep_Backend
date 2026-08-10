import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // e.g. "optA"
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: "A question must have at least 2 options",
      },
    },
    correctOptionId: {
      type: String,
      required: [true, "Correct option id is required"],
    },
    marks: {
      type: Number,
      required: true,
      min: [0.25, "Marks must be at least 0.25"],
      default: 1,
    },
    explanation: {
      type: String,
      trim: true,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    topic: {
      type: String,
      trim: true,
      default: "General",
    },
  },
  { timestamps: true }
);

// Validate that correctOptionId actually matches one of the provided options
questionSchema.pre("validate", function validateCorrectOption(next) {
  if (this.options && this.options.length > 0) {
    const ids = this.options.map((o) => o.id);
    if (!ids.includes(this.correctOptionId)) {
      return next(new Error("correctOptionId must match one of the option ids"));
    }
  }
  next();
});

questionSchema.index({ examId: 1, sectionId: 1 });
questionSchema.index({ topic: 1 });

const Question = mongoose.model("Question", questionSchema);
export default Question;
