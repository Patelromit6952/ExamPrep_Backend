import ApiError from "../utils/ApiError.js";

export const validateAnswerPayload = (req, res, next) => {
  const { questionId } = req.body;
  const errors = [];

  if (!questionId) {
    errors.push("questionId is required");
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }
  next();
};

export const validateReviewPayload = (req, res, next) => {
  const { questionId } = req.body;
  const errors = [];

  if (!questionId) {
    errors.push("questionId is required");
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }
  next();
};
