import express from "express";
import { register, login, logout, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateRegister, validateLogin } from "../validations/auth.validation.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.post("/register", authLimiter, validateRegister, register);
router.post("/login", authLimiter, validateLogin, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
