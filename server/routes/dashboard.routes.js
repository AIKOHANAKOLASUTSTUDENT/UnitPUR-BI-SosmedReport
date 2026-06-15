import express from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { getDashboardController } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/instagram", requireAuth, (req, res) =>
  getDashboardController(req, res, "instagram"),
);
router.get("/facebook", requireAuth, (req, res) =>
  getDashboardController(req, res, "facebook"),
);
router.get("/tiktok", requireAuth, (req, res) =>
  getDashboardController(req, res, "tiktok"),
);
router.get("/youtube", requireAuth, (req, res) =>
  getDashboardController(req, res, "youtube"),
);

export default router;
