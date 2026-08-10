import ApiError from "../utils/ApiError.js";

/**
 * Restricts a route to specific roles. Must run after `protect`.
 * Usage: router.post('/exams', protect, authorize('admin'), createExam)
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Not authenticated.");
  }

  if (!allowedRoles.includes(req.user.role)) {
    throw new ApiError(
      403,
      `Access denied. This action requires one of the following roles: ${allowedRoles.join(", ")}`
    );
  }

  next();
};

export default authorize;
