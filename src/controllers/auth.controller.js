// import User from "../models/User.js";
// import asyncHandler from "../utils/asyncHandler.js";
// import ApiError from "../utils/ApiError.js";
// import ApiResponse from "../utils/ApiResponse.js";
// import { generateTokenAndSetCookie, clearTokenCookie } from "../utils/generateToken.js";

// // @desc    Register a new student account
// // @route   POST /api/auth/register
// // @access  Public
// export const register = asyncHandler(async (req, res) => {
//   const { name, email, password } = req.body;

//   const existingUser = await User.findOne({ email: email.toLowerCase() });
//   if (existingUser) {
//     throw new ApiError(409, "An account with this email already exists");
//   }

//   // Public registration always creates a student account. Admin accounts
//   // are provisioned via the seed script only, never through this endpoint.
//   const user = await User.create({
//     name,
//     email: email.toLowerCase(),
//     password,
//     role: "student",
//   });

//   generateTokenAndSetCookie(res, user._id);

//   res
//     .status(201)
//     .json(new ApiResponse(201, { user }, "Account created successfully"));
// });

// // @desc    Login with email and password
// // @route   POST /api/auth/login
// // @access  Public
// export const login = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

//   if (!user || !(await user.comparePassword(password))) {
//     throw new ApiError(401, "Invalid email or password");
//   }

//   if (!user.isActive) {
//     throw new ApiError(403, "This account has been deactivated. Contact support.");
//   }

//   generateTokenAndSetCookie(res, user._id);

//   res.status(200).json(new ApiResponse(200, { user }, "Logged in successfully"));
// });

// // @desc    Logout the current user
// // @route   POST /api/auth/logout
// // @access  Private
// export const logout = asyncHandler(async (req, res) => {
//   clearTokenCookie(res);
//   res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
// });

// // @desc    Get the currently authenticated user
// // @route   GET /api/auth/me
// // @access  Private
// export const getMe = asyncHandler(async (req, res) => {
//   res.status(200).json(new ApiResponse(200, { user: req.user }, "Current user fetched"));
// });

import crypto from "crypto";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  generateTokenAndSetCookie,
  clearTokenCookie
} from "../utils/generateToken.js";
import { generateOtp, getOtpExpiry } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/mailer.js";

const STALE_SESSION_MS = () =>
  (Number(process.env.STALE_SESSION_MINUTES) || 30) * 60 * 1000;

/** A session counts as stale (safe to override) if it has no activity within the window. */
const isSessionStale = (session) => {
  if (!session?.sessionId) return true;
  if (!session.lastActivityAt) return true;
  return (
    Date.now() - new Date(session.lastActivityAt).getTime() > STALE_SESSION_MS()
  );
};

/** Mutates `user` with a fresh session id. Caller is responsible for saving. */
const assignNewSession = (user) => {
  const sessionId = crypto.randomUUID();
  user.activeSession = {
    sessionId,
    createdAt: new Date(),
    lastActivityAt: new Date()
  };
  return sessionId;
};

// @desc    Register a new student account. Does NOT log the user in - an
//          OTP is emailed and must be verified first.
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser && existingUser.isEmailVerified) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const otp = generateOtp();

  if (existingUser) {
    // Re-registering an unverified account: refresh details + resend OTP
    // instead of creating a duplicate record.
    existingUser.name = name;
    existingUser.password = password; // re-hashed by the pre-save hook
    existingUser.otp = {
      code: otp,
      expiresAt: getOtpExpiry(),
      purpose: "verify-email"
    };
    await existingUser.save();
    await sendOtpEmail(existingUser.email, otp);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { email: existingUser.email },
          "OTP sent to your email."
        )
      );
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: "student",
    isEmailVerified: false,
    otp: { code: otp, expiresAt: getOtpExpiry(), purpose: "verify-email" }
  });

  await sendOtpEmail(user.email, otp);

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { email: user.email },
        "Account created. OTP sent to your email."
      )
    );
});

// @desc    Verify the OTP sent at registration. Logs the user in immediately
//          afterwards, unless another session is already active elsewhere.
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, "No account found with this email");

  if (user.isEmailVerified) {
    throw new ApiError(400, "This account is already verified. Please log in.");
  }
  if (!user.otp?.code || !user.otp?.expiresAt) {
    throw new ApiError(
      400,
      "No OTP was requested for this account. Please register again."
    );
  }
  if (new Date(user.otp.expiresAt).getTime() < Date.now()) {
    throw new ApiError(400, "This OTP has expired. Please request a new one.");
  }
  if (user.otp.code !== String(otp).trim()) {
    throw new ApiError(400, "Invalid OTP");
  }

  user.isEmailVerified = true;
  user.otp = { code: null, expiresAt: null, purpose: null };

  let sessionId = null;
  if (isSessionStale(user.activeSession)) {
    sessionId = assignNewSession(user);
  }
  await user.save();

  if (sessionId) {
    generateTokenAndSetCookie(res, user._id, sessionId);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user, loggedIn: true },
          "Email verified and logged in successfully"
        )
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: null, loggedIn: false },
        "Email verified successfully. Please log in to continue."
      )
    );
});

// @desc    Resend a fresh OTP to an unverified account
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, "No account found with this email");
  if (user.isEmailVerified) {
    throw new ApiError(400, "This account is already verified. Please log in.");
  }

  const otp = generateOtp();
  user.otp = { code: otp, expiresAt: getOtpExpiry(), purpose: "verify-email" };
  await user.save();
  await sendOtpEmail(user.email, otp);

  res
    .status(200)
    .json(new ApiResponse(200, null, "A new OTP has been sent to your email."));
});

// @desc    Login with email and password. Blocked if the account already
//          has an active (non-stale) session elsewhere.
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      "This account has been deactivated. Contact support."
    );
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in.", [
      "email-not-verified"
    ]);
  }

  if (!isSessionStale(user.activeSession)) {
    throw new ApiError(
      409,
      "This account is already logged in on another device. Please log out there first.",
      ["already-logged-in"]
    );
  }

  const sessionId = assignNewSession(user);
  await user.save();

  generateTokenAndSetCookie(res, user._id, sessionId);

  res
    .status(200)
    .json(new ApiResponse(200, { user }, "Logged in successfully"));
});

// @desc    Logout the current user and free up their session slot
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  await User.updateOne(
    { _id: req.user._id },
    {
      $set: {
        activeSession: {
          sessionId: null,
          createdAt: null,
          lastActivityAt: null
        }
      }
    }
  );
  clearTokenCookie(res);
  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

// @desc    Get the currently authenticated user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, "Current user fetched"));
});

// @desc    Admin escape hatch: force-clear a user's active session, in case
//          they've lost access to their original device and don't want to
//          wait out the stale-session window.
// @route   PATCH /api/auth/force-logout/:userId
// @access  Private/Admin
export const forceLogoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) throw new ApiError(404, "User not found");

  user.activeSession = {
    sessionId: null,
    createdAt: null,
    lastActivityAt: null
  };
  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, null, "The user's active session has been cleared")
    );
});