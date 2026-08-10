import ApiError from "../utils/ApiError.js";

export const validateQuestionPayload = (req, res, next) => {
  const { examId, questionText, options, correctOptionId, marks } = req.body;
  const errors = [];

  if (!examId) errors.push("examId is required");
  if (!questionText || questionText.trim().length < 3) {
    errors.push("Question text must be at least 3 characters");
  }
  if (!Array.isArray(options) || options.length < 2) {
    errors.push("At least 2 options are required");
  } else {
    const ids = options.map((o) => o.id);
    if (new Set(ids).size !== ids.length) {
      errors.push("Option ids must be unique");
    }
    if (options.some((o) => !o.text || !o.text.trim())) {
      errors.push("Every option must have text");
    }
    if (!correctOptionId || !ids.includes(correctOptionId)) {
      errors.push("correctOptionId must match one of the given option ids");
    }
  }
  if (marks === undefined || Number(marks) <= 0) {
    errors.push("Marks must be a positive number");
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }
  next();
};
