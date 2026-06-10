CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'YOUTUBE');
CREATE TYPE "AccountType" AS ENUM ('BUSINESS', 'CREATOR', 'PAGE', 'CHANNEL', 'PERSONAL');
CREATE TYPE "ContentType" AS ENUM ('POST', 'REEL', 'STORY', 'VIDEO', 'SHORT', 'OTHER');
CREATE TYPE "ContentState" AS ENUM ('PENDING', 'SYNCED', 'FAILED');
CREATE TYPE "ExportFormat" AS ENUM ('CSV', 'XLSX');
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL,
  "password_hash" TEXT,
  "display_name" VARCHAR(255),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");

CREATE TABLE "social_accounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "platform" "Platform" NOT NULL,
  "account_id" VARCHAR(255) NOT NULL,
  "account_name" VARCHAR(255) NOT NULL,
  "account_type" "AccountType",
  "access_token" TEXT NOT NULL,
  "refresh_token" TEXT,
  "expires_at" TIMESTAMP(3),
  "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "social_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "social_accounts_user_platform_account_key" ON "social_accounts"("user_id", "platform", "account_id");
CREATE INDEX "social_accounts_user_platform_idx" ON "social_accounts"("user_id", "platform");
CREATE INDEX "social_accounts_platform_account_idx" ON "social_accounts"("platform", "account_id");

CREATE TABLE "monitored_content" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "social_account_id" UUID NOT NULL,
  "platform" "Platform" NOT NULL,
  "content_id" VARCHAR(255),
  "content_url" TEXT NOT NULL,
  "content_type" "ContentType",
  "title" VARCHAR(500),
  "status" "ContentState" NOT NULL DEFAULT 'PENDING',
  "published_at" TIMESTAMP(3),
  "last_synced_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "monitored_content_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "monitored_content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "monitored_content_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "monitored_content_account_url_key" ON "monitored_content"("social_account_id", "content_url");
CREATE INDEX "monitored_content_user_platform_idx" ON "monitored_content"("user_id", "platform");
CREATE INDEX "monitored_content_social_account_idx" ON "monitored_content"("social_account_id");
CREATE INDEX "monitored_content_status_idx" ON "monitored_content"("status");

CREATE TABLE "engagement_metrics" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "monitored_content_id" UUID NOT NULL,
  "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  "saves" INTEGER NOT NULL DEFAULT 0,
  "favorites" INTEGER NOT NULL DEFAULT 0,
  "views" INTEGER NOT NULL DEFAULT 0,
  "reach" INTEGER NOT NULL DEFAULT 0,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "reposts" INTEGER NOT NULL DEFAULT 0,
  "watch_time_hours" DECIMAL(12, 2),
  "total_engagement" INTEGER NOT NULL DEFAULT 0,
  "raw_payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "engagement_metrics_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "engagement_metrics_monitored_content_id_fkey" FOREIGN KEY ("monitored_content_id") REFERENCES "monitored_content"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "engagement_metrics_content_captured_idx" ON "engagement_metrics"("monitored_content_id", "captured_at");
CREATE INDEX "engagement_metrics_captured_idx" ON "engagement_metrics"("captured_at");

CREATE TABLE "report_exports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "platform" "Platform" NOT NULL,
  "format" "ExportFormat" NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "file_path" TEXT NOT NULL,
  "records_count" INTEGER NOT NULL,
  "filters" JSONB,
  "status" "ExportStatus" NOT NULL DEFAULT 'COMPLETED',
  "exported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "report_exports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "report_exports_user_exported_idx" ON "report_exports"("user_id", "exported_at");
CREATE INDEX "report_exports_platform_exported_idx" ON "report_exports"("platform", "exported_at");
