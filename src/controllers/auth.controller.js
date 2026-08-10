import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { generateTokenAndSetCookie, clearTokenCookie } from "../utils/generateToken.js";

// @desc    Register a new student account
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // Public registration always creates a student account. Admin accounts
  // are provisioned via the seed script only, never through this endpoint.
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: "student",
  });

  generateTokenAndSetCookie(res, user._id);

  res
    .status(201)
    .json(new ApiResponse(201, { user }, "Account created successfully"));
});

// @desc    Login with email and password
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated. Contact support.");
  }

  generateTokenAndSetCookie(res, user._id);

  res.status(200).json(new ApiResponse(200, { user }, "Logged in successfully"));
});

// @desc    Logout the current user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

// @desc    Get the currently authenticated user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user }, "Current user fetched"));
});
