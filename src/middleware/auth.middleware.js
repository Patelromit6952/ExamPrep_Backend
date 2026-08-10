import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/User.js";

/**
 * Verifies the JWT stored in the httpOnly `token` cookie, loads the
 * corresponding user, and attaches it to req.user. Rejects if the token
 * is missing/invalid or the user is inactive/deleted.
 */
export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw new ApiError(401, "Not authenticated. Please log in.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Session expired or invalid. Please log in again.");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, "User no longer exists.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated.");
  }

  req.user = user;
  next();
});
