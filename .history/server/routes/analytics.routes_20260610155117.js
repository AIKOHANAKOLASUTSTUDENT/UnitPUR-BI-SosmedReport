import express from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { runAnalyticsController } from "../controllers/analytics.controller.js";

const router = express.Router();

router.post("/run", requireAuth, runAnalyticsController);

export default router;
