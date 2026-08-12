// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
//       minlength: [2, "Name must be at least 2 characters"],
//       maxlength: [80, "Name cannot exceed 80 characters"],
//     },
//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       unique: true,
//       lowercase: true,
//       trim: true,
//       match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
//     },
//     password: {
//       type: String,
//       required: [true, "Password is required"],
//       minlength: [6, "Password must be at least 6 characters"],
//       select: false,
//     },
//     role: {
//       type: String,
//       enum: ["student", "admin"],
//       default: "student",
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// userSchema.index({ role: 1 });

// // Hash password before saving, only if it was modified
// userSchema.pre("save", async function hashPassword(next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Instance method to compare plaintext password with the hashed one
// userSchema.methods.comparePassword = async function comparePassword(candidate) {
//   return bcrypt.compare(candidate, this.password);
// };

// // Never leak the password hash even if accidentally serialized
// userSchema.methods.toJSON = function toJSON() {
//   const obj = this.toObject();
//   delete obj.password;
//   return obj;
// };

// const User = mongoose.model("User", userSchema);
// export default User;

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    // Short-lived OTP for email verification. Cleared once used.
    otp: {
      code: { type: String, default: null },
      expiresAt: { type: Date, default: null },
      purpose: { type: String, enum: ["verify-email"], default: null }
    },
    // Enforces "one active session at a time". A login is only allowed if
    // there's no session, or the existing session has gone stale (no
    // activity for STALE_SESSION_MINUTES) - this prevents someone from being
    // permanently locked out just because they closed the browser without
    // logging out.
    activeSession: {
      sessionId: { type: String, default: null },
      createdAt: { type: Date, default: null },
      lastActivityAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

// Hash password before saving, only if it was modified
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare plaintext password with the hashed one
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never leak the password hash, OTP, or session internals if serialized
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.activeSession;
  return obj;
};

const User = mongoose.model("User", userSchema);
export default User;