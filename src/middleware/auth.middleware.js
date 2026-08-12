// import jwt from "jsonwebtoken";
// import asyncHandler from "../utils/asyncHandler.js";
// import ApiError from "../utils/ApiError.js";
// import User from "../models/User.js";

// /**
//  * Verifies the JWT stored in the httpOnly `token` cookie, loads the
//  * corresponding user, and attaches it to req.user. Rejects if the token
//  * is missing/invalid or the user is inactive/deleted.
//  */
// export const protect = asyncHandler(async (req, res, next) => {
//   const token = req.cookies?.token;

//   if (!token) {
//     throw new ApiError(401, "Not authenticated. Please log in.");
//   }

//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.JWT_SECRET);
//   } catch (err) {
//     throw new ApiError(401, "Session expired or invalid. Please log in again.");
//   }

//   const user = await User.findById(decoded.id);

//   if (!user) {
//     throw new ApiError(401, "User no longer exists.");
//   }

//   if (!user.isActive) {
//     throw new ApiError(403, "This account has been deactivated.");
//   }

//   req.user = user;
//   next();
// });

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

  // Single-session enforcement: this token is only valid if it matches the
  // session currently recorded on the user. If they logged in elsewhere (or
  // an admin force-logged them out), this token is now stale.
  if (
    !user.activeSession?.sessionId ||
    user.activeSession.sessionId !== decoded.sessionId
  ) {
    throw new ApiError(
      401,
      "You have been logged out because this account was signed in elsewhere."
    );
  }

  // Fire-and-forget activity heartbeat - keeps the session "alive" so it
  // isn't treated as stale, without slowing down the request.
  User.updateOne(
    { _id: user._id },
    { $set: { "activeSession.lastActivityAt": new Date() } }
  ).catch(() => {});

  req.user = user;
  next();
});