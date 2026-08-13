// import mongoose from "mongoose";

// const examSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: [true, "Exam title is required"],
//       trim: true,
//       maxlength: [150, "Title cannot exceed 150 characters"],
//     },
//     description: {
//       type: String,
//       trim: true,
//       default: "",
//       maxlength: [2000, "Description cannot exceed 2000 characters"],
//     },
//     category: {
//       type: String,
//       enum: ["SSC", "Banking", "Railway", "GPSC", "UPSC", "Other"],
//       default: "Other",
//     },
//     durationMinutes: {
//       type: Number,
//       required: [true, "Duration is required"],
//       min: [1, "Duration must be at least 1 minute"],
//     },
//     totalMarks: {
//       type: Number,
//       required: [true, "Total marks is required"],
//       min: [0, "Total marks cannot be negative"],
//     },
//     negativeMarks: {
//       type: Number,
//       default: 0,
//       min: [0, "Negative marks cannot be negative"],
//     },
//     instructions: {
//       type: [String],
//       default: [],
//     },
//     isPublished: {
//       type: Boolean,
//       default: false,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// examSchema.index({ isPublished: 1, createdAt: -1 });
// examSchema.index({ title: "text", description: "text" });

// const Exam = mongoose.model("Exam", examSchema);
// export default Exam;

import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"]
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    category: {
      type: String,
      enum: [
        "SSC",
        "Banking",
        "Railway",
        "GPSC",
        "UPSC",
        "Other",
        "GSSSB",
        "GPSSB"
      ],
      default: "Other"
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"]
    },
    totalMarks: {
      type: Number,
      required: [true, "Total marks is required"],
      min: [0, "Total marks cannot be negative"]
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: [0, "Negative marks cannot be negative"]
    },
    instructions: {
      type: [String],
      default: []
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    isSectionTimed: {
      type: Boolean,
      default: false
    },
    // Gates access behind an active subscription. Free exams (the default)
    // remain open to any logged-in student.
    isPremium: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

examSchema.index({ isPublished: 1, createdAt: -1 });
examSchema.index({ title: "text", description: "text" });

const Exam = mongoose.model("Exam", examSchema);
export default Exam;
