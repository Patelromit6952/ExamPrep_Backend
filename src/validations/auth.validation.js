import ApiError from "../utils/ApiError.js";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push("A valid email is required");
  }
  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push("A valid email is required");
  }
  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }
  next();
};
