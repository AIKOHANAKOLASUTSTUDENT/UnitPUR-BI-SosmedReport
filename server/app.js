import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import oauthRoutes from "./routes/oauth.routes.js";
import instagramRoutes from "./routes/instagram.routes.js";

import contentRoutes from "./routes/content.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import exportRoutes from "./routes/export.routes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

// Auth + OAuth (new structure)
app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
// Phase-1 Instagram endpoints
app.use("/api/instagram", instagramRoutes);

// New DB-backed API routes
app.use("/api/content", contentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/export", exportRoutes);

// Healthcheck
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "social-engagement-api" });
});

// Backward compatibility routes are still registered in server/index.js
// (kept to avoid breaking existing frontend during Phase 1 migration).

app.listen(port, () => {
  console.log(`API server listening on http://127.0.0.1:${port}`);
});

export default app;
