import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },
    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"]
    },
    order: {
      type: Number,
      required: true,
      default: 0
    },
    durationMinutes: {
      type: Number,
      default: null,
      min: [1, "Section duration must be at least 1 minute"]
    }
  },
  { timestamps: true }
);

sectionSchema.index({ examId: 1, order: 1 });

const Section = mongoose.model("Section", sectionSchema);
export default Section;
