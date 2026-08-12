// import mongoose from "mongoose";

// const planSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Plan name is required"],
//       trim: true,
//       maxlength: [100, "Name cannot exceed 100 characters"]
//     },
//     description: {
//       type: String,
//       trim: true,
//       default: "",
//       maxlength: [500, "Description cannot exceed 500 characters"]
//     },
//     price: {
//       type: Number,
//       required: [true, "Price is required"],
//       min: [0, "Price cannot be negative"]
//     },
//     currency: {
//       type: String,
//       default: "INR"
//     },
//     durationDays: {
//       type: Number,
//       required: [true, "Duration in days is required"],
//       min: [1, "Duration must be at least 1 day"]
//     },
//     features: {
//       type: [String],
//       default: []
//     },
//     isActive: {
//       type: Boolean,
//       default: true
//     }
//   },
//   { timestamps: true }
// );

// planSchema.index({ isActive: 1, price: 1 });

// const Plan = mongoose.model("Plan", planSchema);
// export default Plan;

import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"]
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },
    currency: {
      type: String,
      default: "INR"
    },
    durationDays: {
      type: Number,
      required: [true, "Duration in days is required"],
      min: [1, "Duration must be at least 1 day"]
    },
    // How many times a subscriber on this plan may attempt any ONE exam.
    // 0 means unlimited retries per exam.
    maxAttemptsPerExam: {
      type: Number,
      default: 0,
      min: [0, "Must be 0 (unlimited) or a positive number"]
    },
    features: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

planSchema.index({ isActive: 1, price: 1 });

const Plan = mongoose.model("Plan", planSchema);
export default Plan;