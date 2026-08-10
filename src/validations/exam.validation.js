import ApiError from "../utils/ApiError.js";

export const validateExamPayload = (req, res, next) => {
  const { title, durationMinutes, totalMarks } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3) {
    errors.push("Title must be at least 3 characters");
  }
  if (durationMinutes === undefined || Number(durationMinutes) <= 0) {
    errors.push("Duration must be a positive number of minutes");
  }
  if (totalMarks === undefined || Number(totalMarks) < 0) {
    errors.push("Total marks must be a non-negative number");
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }
  next();
};

export const validateSectionPayload = (req, res, next) => {
  const { title } = req.body;
  const errors = [];

  if (!title || title.trim().length < 2) {
    errors.push("Section title must be at least 2 characters");
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }
  next();
};
