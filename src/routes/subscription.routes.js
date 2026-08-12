import express from "express";
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getMySubscription,
  getAllSubscriptions
} from "../controllers/subscription.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import { validatePlanPayload } from "../validations/subscription.validation.js";

const router = express.Router();

router.use(protect);

router.get("/plans", getPlans);
router.post("/plans", authorize("admin"), validatePlanPayload, createPlan);
router.put("/plans/:id", authorize("admin"), updatePlan);
router.delete("/plans/:id", authorize("admin"), deletePlan);

router.get("/me", getMySubscription);
router.get("/all", authorize("admin"), getAllSubscriptions);

export default router;
