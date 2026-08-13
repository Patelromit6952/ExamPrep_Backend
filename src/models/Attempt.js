// import mongoose from "mongoose";

// const attemptSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     examId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Exam",
//       required: true,
//     },
//     startedAt: {
//       type: Date,
//       required: true,
//       default: Date.now,
//     },
//     // Server-computed absolute deadline = startedAt + exam.durationMinutes.
//     // This is the single source of truth for the countdown timer and for
//     // deciding whether an attempt should be auto-submitted.
//     endsAt: {
//       type: Date,
//       required: true,
//     },
//     submittedAt: {
//       type: Date,
//       default: null,
//     },
//     status: {
//       type: String,
//       enum: ["in-progress", "submitted", "auto-submitted"],
//       default: "in-progress",
//     },
//     // Randomized order of question ids shown to this student for this attempt
//     questionOrder: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Question",
//       },
//     ],
//     // Per-question shuffled option order: Map<questionId string, string[] optionIds>
//     optionOrders: {
//       type: Map,
//       of: [String],
//       default: {},
//     },
//     score: {
//       type: Number,
//       default: 0,
//     },
//     totalQuestions: {
//       type: Number,
//       default: 0,
//     },
//     correctCount: {
//       type: Number,
//       default: 0,
//     },
//     wrongCount: {
//       type: Number,
//       default: 0,
//     },
//     unansweredCount: {
//       type: Number,
//       default: 0,
//     },
//   },
//   { timestamps: true }
// );

// attemptSchema.index({ userId: 1, examId: 1 });
// attemptSchema.index({ userId: 1, status: 1 });

// const Attempt = mongoose.model("Attempt", attemptSchema);
// export default Attempt;

import mongoose from "mongoose";

// Per-section timing/lock state within an attempt. No _id needed - these
// live inside a Map keyed by section id.
const sectionStateSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending"
    }
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    // Server-computed absolute deadline. For a non-sectional exam this is
    // startedAt + exam.durationMinutes. For a section-timed exam this is an
    // overall ceiling (sum of all section durations) used only as a
    // defense-in-depth safety net - the real pacing is enforced per-section
    // via sectionState below.
    endsAt: {
      type: Date,
      required: true
    },
    submittedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["in-progress", "submitted", "auto-submitted"],
      default: "in-progress"
    },
    // Randomized order of question ids shown to this student for this
    // attempt. For a section-timed exam, this is grouped by section (in
    // section order), shuffled within each section, rather than shuffled
    // across the whole exam.
    questionOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
      }
    ],
    // Per-question shuffled option order: Map<questionId string, string[] optionIds>
    optionOrders: {
      type: Map,
      of: [String],
      default: {}
    },
    // Snapshot of exam.isSectionTimed at the moment the attempt started, so
    // a later admin edit doesn't retroactively change an in-progress attempt.
    isSectionTimed: {
      type: Boolean,
      default: false
    },
    // Section ids in the order they must be taken (mirrors Section.order)
    sectionOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section"
      }
    ],
    // Index into sectionOrder of the currently active (unlocked) section
    currentSectionIndex: {
      type: Number,
      default: 0
    },
    // Map<sectionId string, sectionStateSchema>
    sectionState: {
      type: Map,
      of: sectionStateSchema,
      default: {}
    },
    score: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    correctCount: {
      type: Number,
      default: 0
    },
    wrongCount: {
      type: Number,
      default: 0
    },
    unansweredCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

attemptSchema.index({ userId: 1, examId: 1 });
attemptSchema.index({ userId: 1, status: 1 });

const Attempt = mongoose.model("Attempt", attemptSchema);
export default Attempt;