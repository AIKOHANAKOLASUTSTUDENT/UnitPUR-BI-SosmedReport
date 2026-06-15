import express from "express";
import { requireAuth } from "../middleware/require-auth.js";
import {
  addContentController,
  listContentController,
  deleteContentController,
} from "../controllers/content.controller.js";

const router = express.Router();

router.post("/add", requireAuth, addContentController);
router.get("/", requireAuth, listContentController);
router.delete("/:id", requireAuth, deleteContentController);

export default router;
