// import express from "express";
// import { register, login, logout, getMe } from "../controllers/auth.controller.js";
// import { protect } from "../middleware/auth.middleware.js";
// import { validateRegister, validateLogin } from "../validations/auth.validation.js";
// import { authLimiter } from "../middleware/rateLimiter.middleware.js";

// const router = express.Router();

// router.post("/register", authLimiter, validateRegister, register);
// router.post("/login", authLimiter, validateLogin, login);
// router.post("/logout", protect, logout);
// router.get("/me", protect, getMe);

// export default router;

import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  verifyOtp,
  resendOtp,
  forceLogoutUser
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import {
  validateRegister,
  validateLogin,
  validateOtpVerify,
  validateResendOtp
} from "../validations/auth.validation.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.post("/register", authLimiter, validateRegister, register);
router.post("/verify-otp", authLimiter, validateOtpVerify, verifyOtp);
router.post("/resend-otp", authLimiter, validateResendOtp, resendOtp);
router.post("/login", authLimiter, validateLogin, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.patch(
  "/force-logout/:userId",
  protect,
  authorize("admin"),
  forceLogoutUser
);

export default router;