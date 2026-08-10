/**
 * Wraps an async route handler and forwards any thrown error to Express's
 * error-handling middleware, removing the need for repetitive try/catch blocks.
 * @param {Function} fn - async (req, res, next) => {}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
