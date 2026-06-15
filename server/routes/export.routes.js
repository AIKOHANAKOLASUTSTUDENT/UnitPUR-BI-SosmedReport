import express from "express";
import { requireAuth } from "../middleware/require-auth.js";
import {
  exportExcelController,
  exportCsvController,
} from "../controllers/export.controller.js";

const router = express.Router();

router.get("/excel/:platform", requireAuth, exportExcelController);
router.get("/csv/:platform", requireAuth, exportCsvController);

export default router;
